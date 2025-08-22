import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import groupActions from "../services/action/groupAction";

export default function GroupPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await groupActions.getAllGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await groupActions.deleteGroup(groupId);
        fetchGroups(); // Refresh the list
      } catch (error) {
        console.error('Error deleting group:', error);
      }
    }
  };

  const handleSetDefault = async (groupId) => {
    try {
      await groupActions.setDefaultGroup(groupId);
      fetchGroups(); // Refresh the list
    } catch (error) {
      console.error('Error setting default group:', error);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.telegramChatTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4 mx-auto">
      {/* Title */}
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
        Telegram group or channel
      </h1>

      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search groups..."
          className="border rounded-md px-2 py-1 w-full max-w-xs text-sm 
                     focus:outline-none focus:ring-1 focus:ring-blue-500 
                     text-gray-800 dark:text-gray-200 
                     bg-white dark:bg-gray-800 
                     border-gray-300 dark:border-gray-600"
        />
        <Link
          to="/admin/Create-group"
          className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-md shadow hover:bg-blue-700"
        >
          Create Group
        </Link>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gray-900 shadow rounded-xl overflow-x-auto">
        <table className="min-w-full text-xs text-left border-collapse text-gray-800 dark:text-gray-200">
          <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <tr>
              <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                Group Name
              </th>
              <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                Platform
              </th>
              <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                Created Date
              </th>
              <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                Purchases & Earnings
              </th>
              <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                Status
              </th>
              <th className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-3 py-4 text-center text-gray-500">
                  Loading groups...
              </td>
              </tr>
            ) : filteredGroups.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-3 py-4 text-center text-gray-500">
                  No groups found. {searchQuery && 'Try adjusting your search.'}
              </td>
            </tr>
            ) : (
              filteredGroups.map((group) => (
                <tr key={group._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      {group.image && (
                        <img 
                          src={group.image} 
                          alt={group.name} 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium text-sm">{group.name}</div>
                        {group.isDefault && (
                          <span className="text-xs text-blue-600 bg-blue-100 px-1 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
              </td>
              <td className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-sm">
                      <div className="font-medium">{group.telegramChatType || 'Not linked'}</div>
                      {group.telegramChatTitle && (
                        <div className="text-xs text-gray-500">{group.telegramChatTitle}</div>
                      )}
                    </div>
              </td>
              <td className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-sm">
                      <div>{new Date(group.createdAt).toLocaleDateString()}</div>
                      {group.linkedAt && (
                        <div className="text-xs text-gray-500">
                          Linked: {new Date(group.linkedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
              </td>
              <td className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-sm">
                      <div>₹{group.stats?.totalRevenue || 0}</div>
                      <div className="text-xs text-gray-500">
                        {group.stats?.totalSubscribers || 0} subscribers
                      </div>
                    </div>
              </td>
              <td className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className={`px-2 py-0.5 text-[10px] rounded-full ${
                      group.status === 'active' 
                        ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                        : group.status === 'pending'
                        ? 'bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-green-300'
                        : group.status === 'error'
                        ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}>
                      {group.status?.charAt(0).toUpperCase() + group.status?.slice(1) || 'Unknown'}
                </span>
              </td>
              <td className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleSetDefault(group._id)}
                        disabled={group.isDefault}
                        className={`px-2 py-0.5 text-xs border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 ${
                          group.isDefault ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {group.isDefault ? 'Default' : 'Set Default'}
                      </button>
                      <button 
                        onClick={() => handleDeleteGroup(group._id)}
                        disabled={group.isDefault}
                        className={`px-2 py-0.5 text-xs border rounded-md hover:bg-red-100 dark:hover:bg-red-700 border-red-300 dark:border-red-600 text-red-600 dark:text-red-300 ${
                          group.isDefault ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        Delete
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
  );
}
