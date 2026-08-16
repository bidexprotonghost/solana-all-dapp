"use client";

const rows = [
  '5hGB...' ,
  '6rQk...' ,
  '2xL7...' ,
  '4AHz...' ,
];

export default function AllowlistTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/70">
      <table className="min-w-full text-left text-sm text-slate-200">
        <thead className="bg-slate-800 text-slate-300">
          <tr>
            <th className="px-4 py-3 font-medium">Wallet</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((wallet, index) => (
            <tr key={wallet} className="border-t border-slate-800">
              <td className="px-4 py-3">{wallet}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                  {index % 2 === 0 ? 'Approved' : 'Pending'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
