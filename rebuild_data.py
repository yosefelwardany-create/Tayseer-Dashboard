# Regenerates data.js and facts.js from fresh Zoho Books exports.
#
#   python tools/rebuild_data.py \
#       --pl "Profit and Loss - JAN2026-AUG2026.xlsx" \
#       --bs "Balance Sheet - 17-09-2026.xlsx" \
#       --aging "Aging by Customer - as of 17-09-2026.xlsx" \
#       --sales "MONTHLY-Sales by Item.xlsx" \
#       --months jan feb mar apr may jun jul aug
#
# Export settings that matter (Zoho Books):
#   P&L:   Reports > Business Overview > Horizontal Profit and Loss, MONTHLY interval,
#          accrual basis, account codes ON. Column count must match --months.
#   Aging: Reports > Receivables > Aging by Customer — the grand Total row is dropped
#          automatically (rows without a CustomerNo).
#
# Zoho quirks this script handles (learned the hard way):
#   - blank cells hold spaces, not None
#   - "Total for X" rows are zeroed and must be dropped
#   - parent accounts can carry their OWN postings besides their children
#     (65900010, 61502330, 65410000...) — they must be KEPT or the P&L stops
#     tying to current-year earnings on the balance sheet
#   - some account names carry U+FFFD garbage from a bad import on Zoho's side
#
# legacy.js is a frozen snapshot of the 10 Aug 2026 export — never regenerated.
# New OPEX accounts not seen before are reported and must be added to GROUP_MAP.

import argparse, json, os, sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import openpyxl

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
blank = lambda v: v is None or (isinstance(v, str) and not v.strip())

def num(v):
    if isinstance(v, (int, float)): return float(v)
    if isinstance(v, str):
        try: return float(v.strip().replace(",", ""))
        except ValueError: return 0.0
    return 0.0

SEC = {"Operating Income": "REV", "Cost of Goods Sold": "COGS", "Operating Expense": "OPEX",
       "Non Operating Income": "NOI", "Non Operating Expense": "NOE"}
FIXED_G = {"REV": "Revenue", "COGS": "Cost of Goods Sold",
           "NOI": "Non-Operating Income", "NOE": "Non-Operating Expense"}

FLAGS = {
    "61100040": "Termination notice pay (G&A) — non-recurring",
    "61100030": "Termination notice pay (S&D) — non-recurring",
    "65900030": "Near-expiry inventory provision — non-cash",
    "65100100": "Doubtful debt provision — non-cash",
    "70900000": "Fines & penalties",
    "70900100": "Fines & penalties — fleet rent",
    "70900102": "Fines & penalties — customs",
    "70900103": "Fines & penalties — traffic",
    "65410002": "Al-Ameed listing & registration — confirm if one-time onboarding",
    "65410000": "Listing fees booked June, reversed July — nets to nil",
    "65900011": "Write-off (expiry/damage, Nongshim) — lumpy",
    "65900010": "Write-off (expiry/damage, finished goods) — non-cash",
}

def load_group_map():
    # Groups come from the current data.js so a regeneration keeps assignments.
    import subprocess
    out = subprocess.run(
        ["node", "-e", "import('./data.js').then(({BASELINE})=>console.log(JSON.stringify(BASELINE)))"],
        capture_output=True, text=True, encoding="utf-8", cwd=HERE)
    return {r["c"]: r["g"] for r in json.loads(out.stdout) if r["s"] == "OPEX"}

def parse_pl(path, months):
    wb = openpyxl.load_workbook(path, data_only=True)
    rows = list(wb.active.iter_rows(values_only=True))
    wb.close()
    ncols = len(months)
    section, out = None, []
    for r in rows[3:]:
        name, code = r[0], r[1]
        stripped = str(name or "").strip()
        vals = [num(v) for v in r[2:2 + ncols]]
        if stripped.startswith("Total for"): continue
        if blank(code):
            if stripped and all(abs(v) < 1e-9 for v in vals): section = stripped
            continue
        if all(abs(v) < 1e-9 for v in vals): continue
        out.append({"section": section, "n": stripped.replace("�", "").strip(),
                    "c": str(code).strip(), **{k: round(v, 2) for k, v in zip(months, vals)}})
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pl", required=True)
    ap.add_argument("--bs")
    ap.add_argument("--aging")
    ap.add_argument("--sales")
    ap.add_argument("--months", nargs="+", required=True)
    args = ap.parse_args()
    MK = args.months

    group_map = load_group_map()
    pl = parse_pl(args.pl, MK)

    rows, unmapped = [], []
    for a in pl:
        s = SEC[a["section"]]
        g = FIXED_G.get(s) or group_map.get(a["c"])
        if not g:
            unmapped.append((a["c"], a["n"]))
            continue
        row = {"s": s, "g": g, "n": a["n"], "c": a["c"], **{k: a[k] for k in MK}}
        row["o"] = a["c"] in FLAGS
        if row["o"]: row["note"] = FLAGS[a["c"]]
        rows.append(row)
    if unmapped:
        print("NEW OPEX ACCOUNTS — add these to the group map in data.js by hand, then rerun:")
        for c, n in unmapped: print("  ", c, n)
        raise SystemExit(1)

    order = {"REV": 0, "COGS": 1, "OPEX": 2, "NOI": 3, "NOE": 4}
    g_order = []
    for r in rows:
        if r["s"] == "OPEX" and r["g"] not in g_order: g_order.append(r["g"])
    rows.sort(key=lambda r: (order[r["s"]],
                             g_order.index(r["g"]) if r["s"] == "OPEX" else 0,
                             r["n"].lower()))

    def js_rows(rr):
        out = []
        for r in rr:
            p = ['"s": ' + json.dumps(r["s"]), '"g": ' + json.dumps(r["g"], ensure_ascii=False),
                 '"n": ' + json.dumps(r["n"], ensure_ascii=False), '"c": ' + json.dumps(r["c"])]
            p += ['"%s": %s' % (m, r[m]) for m in MK]
            p.append('"o": ' + ("true" if r["o"] else "false"))
            if r.get("note"): p.append('"note": ' + json.dumps(r["note"], ensure_ascii=False))
            out.append("  {" + ", ".join(p) + "},")
        return "\n".join(out)

    label = {"jan": "Jan", "feb": "Feb", "mar": "Mar", "apr": "Apr", "may": "May", "jun": "Jun",
             "jul": "Jul", "aug": "Aug", "sep": "Sep", "oct": "Oct", "nov": "Nov", "dec": "Dec"}
    months_js = "\n".join('  { key: "%s", label: "%s 2026", short: "%s" },' % (k, label[k], label[k]) for k in MK)
    header = ("// Tayseer Trading Company — generated by tools/rebuild_data.py\n"
              "// Source: Zoho Books horizontal P&L, accrual, leaf accounts + parent-own postings.\n"
              "// See tools/rebuild_data.py for the export settings and quirks.\n\n")
    with open(os.path.join(HERE, "data.js"), "w", encoding="utf-8") as f:
        f.write(header + "export const MONTHS = [\n" + months_js + "\n];\n\n"
                + "export const BASELINE = [\n" + js_rows(rows) + "\n];\n")

    def res(mk):
        S = lambda sec: sum(a[mk] for a in pl if a["section"] == sec)
        return (S("Operating Income") - S("Cost of Goods Sold") - S("Operating Expense")
                + S("Non Operating Income") - S("Non Operating Expense"))
    print("rows:", len(rows))
    for m in MK: print(" ", m, format(round(res(m)), ","))
    print("YTD:", format(round(sum(res(m) for m in MK)), ","))
    print("data.js written. facts.js (balance sheet / aging / sales) — rerun the fuller",
          "pipeline or update by hand; the P&L is the part that must never drift.")

if __name__ == "__main__":
    main()
