"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";

interface ProjectTabsProps {
  projectId: string;
  currentUserId: string;
  initialProjections: any[];
  initialCheckpoints: any[];
}

export default function ProjectTabs({
  projectId,
  currentUserId,
  initialProjections,
  initialCheckpoints,
}: ProjectTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "projections" | "approvals" | "features"
  >("projections");
  const [projections, setProjections] = useState(initialProjections);
  const [users, setUsers] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProjection, setSelectedProjection] = useState<string | null>(
    null
  );
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [projectionApprovals, setProjectionApprovals] = useState<{
    [key: string]: any[];
  }>({});

  // Projection form
  const [projectionName, setProjectionName] = useState("");
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvFilename, setCsvFilename] = useState("");

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Load all approvals when approvals tab is selected
  useEffect(() => {
    if (activeTab === "approvals" && projections.length > 0) {
      projections.forEach((proj) => {
        if (!projectionApprovals[proj._id]) {
          loadApprovals(proj._id);
        }
      });
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Feature form
  const [featureForm, setFeatureForm] = useState({
    name: "",
    description: "",
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFilename(file.name);
    Papa.parse(file, {
      header: false, // Parse as raw array to preserve structure
      skipEmptyLines: false, // Keep empty lines for structure
      complete: (results) => {
        setCsvData(results.data as any[][]);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        alert("Failed to parse CSV file");
      },
    });
  };

  const handleAddProjection = async () => {
    if (!projectionName || csvData.length === 0) {
      alert("Please provide a name and upload a CSV file");
      return;
    }

    setLoading(true);
    try {
      const columnCount = csvData.length > 0 ? (csvData[0] as any[]).length : 0;
      const res = await fetch(`/api/projects/${projectId}/projections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectionName,
          data: csvData,
          filename: csvFilename,
          rowCount: csvData.length,
          columnCount: columnCount,
        }),
      });

      if (res.ok) {
        const newProjection = await res.json();
        setProjections([newProjection, ...projections]);
        setProjectionName("");
        setCsvData([]);
        setCsvFilename("");
        // Reset file input
        const fileInput = document.getElementById(
          "csv-file"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        alert("Failed to add projection");
      }
    } catch (error) {
      console.error("Error adding projection:", error);
      alert("Failed to add projection");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestApprovals = async () => {
    if (!selectedProjection || selectedUsers.length === 0) {
      alert("Please select a projection and at least one user");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/projections/${selectedProjection}/approvals`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: selectedUsers }),
        }
      );

      if (res.ok) {
        alert("Approval requests sent successfully");
        setSelectedUsers([]);
        loadApprovals(selectedProjection);
      } else {
        alert("Failed to request approvals");
      }
    } catch (error) {
      console.error("Error requesting approvals:", error);
      alert("Failed to request approvals");
    } finally {
      setLoading(false);
    }
  };

  const loadApprovals = async (projectionId: string) => {
    try {
      const res = await fetch(`/api/projections/${projectionId}/approvals`);
      if (res.ok) {
        const data = await res.json();
        setProjectionApprovals((prev) => ({ ...prev, [projectionId]: data }));
      }
    } catch (error) {
      console.error("Error loading approvals:", error);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleApprovalAction = async (
    approvalId: string,
    status: "approved" | "rejected",
    projectionId: string,
    comment?: string
  ) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projection-approvals/${approvalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, comment }),
      });

      if (res.ok) {
        // Reload approvals for this projection
        loadApprovals(projectionId);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update approval");
      }
    } catch (error) {
      console.error("Error updating approval:", error);
      alert("Failed to update approval");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeature = async () => {
    if (!featureForm.name || !featureForm.description) {
      alert("Please provide feature name and description");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/features`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(featureForm),
      });

      if (res.ok) {
        const newFeature = await res.json();
        setFeatures([newFeature, ...features]);
        setFeatureForm({ name: "", description: "" });
      } else {
        alert("Failed to add feature");
      }
    } catch (error) {
      console.error("Error adding feature:", error);
      alert("Failed to add feature");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="border-b-2 border-accent-olive">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("projections")}
            className={`${
              activeTab === "projections"
                ? "border-accent-dark-orange text-accent-dark-orange"
                : "border-transparent text-black dark:text-white hover:border-accent-olive hover:text-accent-light-purple"
            } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors`}
          >
            Projections
          </button>
          <button
            onClick={() => setActiveTab("approvals")}
            className={`${
              activeTab === "approvals"
                ? "border-accent-dark-orange text-accent-dark-orange"
                : "border-transparent text-black dark:text-white hover:border-accent-olive hover:text-accent-light-purple"
            } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors`}
          >
            Approvals
          </button>
          <button
            onClick={() => setActiveTab("features")}
            className={`${
              activeTab === "features"
                ? "border-accent-dark-orange text-accent-dark-orange"
                : "border-transparent text-black dark:text-white hover:border-accent-olive hover:text-accent-light-purple"
            } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors`}
          >
            Features
          </button>
        </nav>
      </div>

      <div className="mt-8">
        {activeTab === "projections" && (
          <div className="space-y-8">
            <div className="rounded-lg bg-white dark:bg-black p-6 shadow border-2 border-accent-olive">
              <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
                Add New Projection
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white">
                    Projection Name
                  </label>
                  <input
                    type="text"
                    value={projectionName}
                    onChange={(e) => setProjectionName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-2 border-accent-olive px-3 py-2 bg-white dark:bg-black text-black dark:text-white focus:border-accent-light-purple focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white">
                    Upload CSV File
                  </label>
                  <input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="mt-1 block w-full text-sm"
                  />
                  {csvData.length > 0 && (
                    <div className="mt-2 text-sm text-accent-olive font-semibold">
                      <p>
                        ✓ Loaded {csvData.length} rows from {csvFilename}
                      </p>
                      <p className="text-xs opacity-70">
                        {(csvData[0] as any[])?.length || 0} columns detected
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleAddProjection}
                  disabled={loading}
                  className="rounded-md bg-accent-dark-orange px-4 py-2 text-sm font-medium text-white hover:bg-accent-light-orange disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Add Projection"}
                </button>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
                Existing Projections
              </h3>
              {projections.length === 0 ? (
                <p className="text-black dark:text-white opacity-60">
                  No projections yet
                </p>
              ) : (
                <div className="space-y-4">
                  {projections.map((proj) => {
                    const data = JSON.parse(proj.data);
                    // Check if data is array-based (new format) or object-based (old format)
                    const isArrayFormat = Array.isArray(data[0]);

                    const downloadCsv = () => {
                      const csv = Papa.unparse(data);
                      const blob = new Blob([csv], { type: "text/csv" });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = proj.filename || `${proj.name}.csv`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                    };

                    const columnCount = isArrayFormat
                      ? (data[0] as any[])?.length || 0
                      : Object.keys(data[0] || {}).length;

                    return (
                      <div
                        key={proj._id}
                        className="rounded-lg bg-white dark:bg-black p-6 shadow border-2 border-accent-olive"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-black dark:text-white">
                              {proj.name}
                            </h4>
                            {proj.filename && (
                              <p className="text-sm text-accent-light-purple">
                                📁 {proj.filename}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={downloadCsv}
                            className="rounded-md bg-accent-light-purple px-3 py-1 text-xs font-medium text-white hover:bg-accent-dark-orange transition-colors"
                          >
                            Download CSV
                          </button>
                        </div>
                        <p className="text-sm text-black dark:text-white opacity-70">
                          {proj.rowCount || data.length} rows ×{" "}
                          {proj.columnCount || columnCount} columns
                        </p>
                        <p className="text-xs text-black dark:text-white opacity-70">
                          Created {new Date(proj.createdAt).toLocaleString()}
                        </p>
                        {data.length > 0 && (
                          <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-accent-olive text-sm">
                              {isArrayFormat ? (
                                <tbody className="divide-y divide-accent-olive bg-white dark:bg-black">
                                  {data
                                    .slice(0, 10)
                                    .map((row: any[], idx: number) => (
                                      <tr
                                        key={idx}
                                        className={
                                          idx === 0
                                            ? "bg-accent-light-purple"
                                            : ""
                                        }
                                      >
                                        {row.map((cell: any, i: number) => (
                                          <td
                                            key={i}
                                            className={`px-4 py-2 ${
                                              idx === 0
                                                ? "font-medium text-white"
                                                : cell === "" ||
                                                  cell === null ||
                                                  cell === undefined
                                                ? "text-gray-400"
                                                : "text-black dark:text-white"
                                            }`}
                                          >
                                            {cell === "" ||
                                            cell === null ||
                                            cell === undefined
                                              ? ""
                                              : String(cell)}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                </tbody>
                              ) : (
                                // Old format: object-based
                                <>
                                  <thead className="bg-accent-light-purple">
                                    <tr>
                                      {Object.keys(data[0]).map((key) => (
                                        <th
                                          key={key}
                                          className="px-4 py-2 text-left font-medium text-white"
                                        >
                                          {key}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-accent-olive bg-white dark:bg-black">
                                    {data
                                      .slice(0, 10)
                                      .map((row: any, idx: number) => (
                                        <tr key={idx}>
                                          {Object.values(row).map(
                                            (val: any, i: number) => (
                                              <td
                                                key={i}
                                                className="px-4 py-2 text-black dark:text-white"
                                              >
                                                {val === "" ||
                                                val === null ||
                                                val === undefined
                                                  ? ""
                                                  : String(val)}
                                              </td>
                                            )
                                          )}
                                        </tr>
                                      ))}
                                  </tbody>
                                </>
                              )}
                            </table>
                            {data.length > 10 && (
                              <p className="mt-2 text-sm text-black dark:text-white opacity-70">
                                Showing 10 of {data.length} rows
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "approvals" && (
          <div className="space-y-8">
            <div className="rounded-lg bg-white dark:bg-black p-6 shadow border-2 border-accent-olive">
              <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
                Request Approvals
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Select Projection
                  </label>
                  <select
                    value={selectedProjection || ""}
                    onChange={(e) => {
                      setSelectedProjection(e.target.value);
                      if (e.target.value) {
                        loadApprovals(e.target.value);
                      }
                    }}
                    className="block w-full rounded-md border-2 border-accent-olive px-3 py-2 bg-white dark:bg-black text-black dark:text-white focus:border-accent-light-purple focus:outline-none"
                  >
                    <option value="">-- Select a projection --</option>
                    {projections.map((proj) => (
                      <option key={proj._id} value={proj._id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Select Users to Approve
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border-2 border-accent-olive rounded-md p-3">
                    {users.length === 0 ? (
                      <p className="text-sm text-black dark:text-white opacity-60">
                        No users available
                      </p>
                    ) : (
                      users.map((user) => (
                        <label
                          key={user._id}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-accent-olive/10 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user._id)}
                            onChange={() => toggleUserSelection(user._id)}
                            className="w-4 h-4 text-accent-dark-orange border-accent-olive rounded focus:ring-accent-light-purple"
                          />
                          <div className="flex items-center space-x-2">
                            {user.image && (
                              <img
                                src={user.image}
                                alt={user.name}
                                className="w-6 h-6 rounded-full"
                              />
                            )}
                            <span className="text-sm text-black dark:text-white">
                              {user.name || user.email}
                            </span>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  {selectedUsers.length > 0 && (
                    <p className="mt-2 text-sm text-accent-olive font-semibold">
                      {selectedUsers.length} user
                      {selectedUsers.length !== 1 ? "s" : ""} selected
                    </p>
                  )}
                </div>

                <button
                  onClick={handleRequestApprovals}
                  disabled={
                    loading || !selectedProjection || selectedUsers.length === 0
                  }
                  className="rounded-md bg-accent-dark-orange px-4 py-2 text-sm font-medium text-white hover:bg-accent-light-orange disabled:opacity-50"
                >
                  {loading ? "Requesting..." : "Request Approvals"}
                </button>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
                All Projection Approvals
              </h3>
              {projections.length === 0 ? (
                <p className="text-black dark:text-white opacity-60">
                  No projections yet
                </p>
              ) : (
                <div className="space-y-6">
                  {projections.map((proj) => {
                    const approvals = projectionApprovals[proj._id] || [];
                    return (
                      <div
                        key={proj._id}
                        className="rounded-lg bg-white dark:bg-black p-6 shadow border-2 border-accent-olive"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg text-black dark:text-white">
                              {proj.name}
                            </h4>
                            {proj.filename && (
                              <p className="text-sm text-accent-light-purple">
                                📁 {proj.filename}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedProjection(proj._id);
                            }}
                            className="text-xs text-accent-light-purple hover:text-accent-dark-orange"
                          >
                            + Request Approval
                          </button>
                        </div>

                        {approvals.length === 0 ? (
                          <p className="text-sm text-black dark:text-white opacity-60">
                            No approval requests yet
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {approvals
                              .sort((a: any, b: any) => {
                                // Sort: pending first, then by date
                                if (
                                  a.status === "pending" &&
                                  b.status !== "pending"
                                )
                                  return -1;
                                if (
                                  a.status !== "pending" &&
                                  b.status === "pending"
                                )
                                  return 1;
                                const aDate =
                                  a.approvedAt || a.rejectedAt || a.createdAt;
                                const bDate =
                                  b.approvedAt || b.rejectedAt || b.createdAt;
                                return (
                                  new Date(bDate).getTime() -
                                  new Date(aDate).getTime()
                                );
                              })
                              .map((approval: any) => (
                                <div
                                  key={approval._id}
                                  className="flex items-center justify-between p-3 rounded border border-accent-olive"
                                >
                                  <div className="flex items-center space-x-3 flex-1">
                                    {approval.user?.image && (
                                      <img
                                        src={approval.user.image}
                                        alt={approval.user.name}
                                        className="w-8 h-8 rounded-full"
                                      />
                                    )}
                                    <div className="flex-1">
                                      <p className="font-medium text-sm text-black dark:text-white">
                                        {approval.user?.name ||
                                          approval.user?.email ||
                                          "Unknown User"}
                                      </p>
                                      {approval.comment && (
                                        <p className="text-xs text-black dark:text-white opacity-70">
                                          {approval.comment}
                                        </p>
                                      )}
                                      <p className="text-xs text-black dark:text-white opacity-60 mt-1">
                                        {approval.status === "approved" &&
                                        approval.approvedAt
                                          ? `Approved ${new Date(
                                              approval.approvedAt
                                            ).toLocaleString()}`
                                          : approval.status === "rejected" &&
                                            approval.rejectedAt
                                          ? `Rejected ${new Date(
                                              approval.rejectedAt
                                            ).toLocaleString()}`
                                          : `Requested ${new Date(
                                              approval.createdAt
                                            ).toLocaleString()}`}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {approval.userId === currentUserId &&
                                    approval.status === "pending" ? (
                                      <>
                                        <button
                                          onClick={() =>
                                            handleApprovalAction(
                                              approval._id,
                                              "approved",
                                              proj._id
                                            )
                                          }
                                          disabled={loading}
                                          className="px-3 py-1 rounded-full text-xs font-semibold bg-accent-olive text-white hover:bg-opacity-80 disabled:opacity-50 transition-colors"
                                        >
                                          ✓ Approve
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleApprovalAction(
                                              approval._id,
                                              "rejected",
                                              proj._id
                                            )
                                          }
                                          disabled={loading}
                                          className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white hover:bg-opacity-80 disabled:opacity-50 transition-colors"
                                        >
                                          ✗ Reject
                                        </button>
                                      </>
                                    ) : (
                                      <span
                                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                          approval.status === "approved"
                                            ? "bg-accent-olive text-white"
                                            : approval.status === "rejected"
                                            ? "bg-red-500 text-white"
                                            : "bg-accent-light-orange text-white"
                                        }`}
                                      >
                                        {approval.status
                                          .charAt(0)
                                          .toUpperCase() +
                                          approval.status.slice(1)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "features" && (
          <div className="space-y-8">
            <div className="rounded-lg bg-white dark:bg-black p-6 shadow border-2 border-accent-olive">
              <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
                Request New Feature
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white">
                    Feature Name
                  </label>
                  <input
                    type="text"
                    value={featureForm.name}
                    onChange={(e) =>
                      setFeatureForm({ ...featureForm, name: e.target.value })
                    }
                    className="mt-1 block w-full rounded-md border-2 border-accent-olive px-3 py-2 bg-white dark:bg-black text-black dark:text-white focus:border-accent-light-purple focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white">
                    Description
                  </label>
                  <textarea
                    value={featureForm.description}
                    onChange={(e) =>
                      setFeatureForm({
                        ...featureForm,
                        description: e.target.value,
                      })
                    }
                    rows={4}
                    className="mt-1 block w-full rounded-md border-2 border-accent-olive px-3 py-2 bg-white dark:bg-black text-black dark:text-white focus:border-accent-light-purple focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleAddFeature}
                  disabled={loading}
                  className="rounded-md bg-accent-dark-orange px-4 py-2 text-sm font-medium text-white hover:bg-accent-light-orange disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Request Feature"}
                </button>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
                Feature Requests
              </h3>
              {features.length === 0 ? (
                <p className="text-black dark:text-white opacity-60">
                  No feature requests yet
                </p>
              ) : (
                <div className="space-y-4">
                  {features.map((feature: any) => (
                    <div
                      key={feature._id}
                      className="rounded-lg bg-white dark:bg-black p-6 shadow border-2 border-accent-olive"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-black dark:text-white">
                            {feature.name}
                          </h4>
                          <p className="mt-1 text-sm text-black dark:text-white opacity-70">
                            {feature.description}
                          </p>
                          <p className="mt-2 text-xs text-black dark:text-white opacity-70">
                            Status:{" "}
                            <span
                              className={`font-medium ${
                                feature.status === "approved"
                                  ? "text-accent-olive"
                                  : feature.status === "pending"
                                  ? "text-accent-light-orange"
                                  : "text-black dark:text-white"
                              }`}
                            >
                              {feature.status}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
