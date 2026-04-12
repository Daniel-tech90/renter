import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { renterService } from '../services';
import Modal from '../components/Modal';
import RenterForm from '../components/RenterForm';

export default function Renters() {
  const [renters, setRenters] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchRenters = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await renterService.getAll(search);
      setRenters(data);
    } catch {
      toast.error('Failed to load renters');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchRenters, 300);
    return () => clearTimeout(t);
  }, [fetchRenters]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name} from the system?`)) return;
    try {
      await renterService.remove(id);
      toast.success('Renter removed successfully');
      fetchRenters();
    } catch {
      toast.error('Failed to remove renter');
    }
  };

  const openAdd = () => { setEditing(null); setShowModal(true); };
  const openEdit = (r) => { setEditing(r); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditing(null); };
  const onSuccess = () => { closeModal(); fetchRenters(); };

  const occupiedRooms = new Set(renters.map((r) => r.roomNumber).filter(Boolean));
  const emptyRoomRenters = renters.filter((r) => !r.roomNumber);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-violet-200">
              👥
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-slate-800 leading-none">{renters.length} Renters</p>
            </div>
          </div>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          ＋ Add New Renter
        </button>
      </div>

      {/* Table Card */}
      <div className="card">
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              className="input pl-10"
              placeholder="Search by name, room or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {search && (
            <button className="btn-secondary text-sm" onClick={() => setSearch('')}>
              ✕ Clear
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="table-header text-left rounded-tl-xl">Tenant</th>
                <th className="table-header text-left">Phone</th>
                <th className="table-header text-left">Room</th>
                <th className="table-header text-left">Monthly Rent</th>
                <th className="table-header text-left">Due Date</th>
                <th className="table-header text-left rounded-tr-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Loading renters...</p>
                  </td>
                </tr>
              ) : renters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="text-4xl mb-3">🏘️</div>
                    <p className="text-slate-500 font-semibold">No renters found</p>
                    <p className="text-slate-400 text-sm mt-1">
                      {search ? 'Try a different search term' : 'Add your first renter to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                renters.map((r) => (
                  <tr key={r._id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          r.isActive ? 'bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {r.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className={`font-semibold ${r.isActive ? 'text-slate-800' : 'text-slate-400'}`}>{r.name}</span>
                          {!r.isActive && (
                            <span className="ml-2 text-xs bg-red-50 text-red-400 border border-red-100 px-2 py-0.5 rounded-lg font-semibold">
                              Left {r.leftAt ? new Date(r.leftAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell text-slate-500">📞 {r.phone}</td>
                    <td className="table-cell">
                      {r.roomNumber ? (
                        <span className="bg-violet-50 text-violet-700 border border-violet-100 px-3 py-1 rounded-xl text-xs font-bold">
                          Room {r.roomNumber}
                        </span>
                      ) : (
                        <span className="bg-slate-50 text-slate-400 border border-slate-200 px-3 py-1 rounded-xl text-xs font-semibold italic">
                          No Room
                        </span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className="font-bold text-slate-800">₹{r.rentAmount.toLocaleString()}</span>
                      <span className="text-slate-400 text-xs">/mo</span>
                    </td>
                    <td className="table-cell">
                      <span className="bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1 rounded-xl text-xs font-semibold">
                        {r.dueDate}th of month
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(r)} className="btn-ghost bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                          ✏️ Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={editing ? '✏️ Edit Renter' : '➕ Add New Renter'} onClose={closeModal}>
          <RenterForm renter={editing} onSuccess={onSuccess} onClose={closeModal} />
        </Modal>
      )}

      {/* Empty Rooms Section */}
      {emptyRoomRenters.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-amber-200">
              🚪
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Unassigned</p>
              <p className="text-lg font-bold text-slate-800">{emptyRoomRenters.length} Empty Room{emptyRoomRenters.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {emptyRoomRenters.map((r) => (
              <div key={r._id} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-sm font-bold text-amber-600">
                    {r.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{r.name}</p>
                    <p className="text-xs text-slate-400">{r.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => openEdit(r)}
                  className="text-xs bg-white border border-amber-200 text-amber-600 hover:bg-amber-100 px-3 py-1.5 rounded-xl font-semibold transition-all"
                >
                  Assign Room
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
