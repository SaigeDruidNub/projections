"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const RolesTab = dynamic(() => import("./RolesTab"), { ssr: false });
import { useSearchParams } from "next/navigation";
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
  // Dynamically fetch the user's project role for this project
  const [currentUserProjectRole, setCurrentUserProjectRole] = useState<
    "member" | "project_manager" | "finance_manager" | "admin" | "none" | null
  >(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        // Adjust the API endpoint as needed to match your backend
        const res = await fetch(
          `/api/projects/${projectId}/users/${currentUserId}/role`
        );
        if (res.ok) {
          const data = await res.json();
          // Expecting { role: "member" | "project_manager" | "finance_manager" | "admin" | "none" }
          setCurrentUserProjectRole(data.role ?? "none");
        } else {
          setCurrentUserProjectRole("none"); // fallback
        }
      } catch (error) {
        setCurrentUserProjectRole("none"); // fallback
      }
    };
    if (projectId && currentUserId) {
      fetchRole();
    }
  }, [projectId, currentUserId]);

  // Projection type: 'financial' or 'project'
  const [projectionType, setProjectionType] = useState<"financial" | "project">(
    "financial"
  );
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<
    "projections" | "approvals" | "roles"
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

  // Email projection state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailProjectionId, setEmailProjectionId] = useState<string | null>(
    null
  );
  const [emailSelectedUsers, setEmailSelectedUsers] = useState<string[]>([]);
  const [emailMessage, setEmailMessage] = useState("");
  const [emailHistory, setEmailHistory] = useState<{ [key: string]: any[] }>(
    {}
  );
  const [showEmailHistory, setShowEmailHistory] = useState<{
    [key: string]: boolean;
  }>({});

  // Projection form
  const [projectionName, setProjectionName] = useState("");
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvFilename, setCsvFilename] = useState("");
  const [creationMode, setCreationMode] = useState<"upload" | "hourly">(
    "upload"
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templateRows, setTemplateRows] = useState<any[][]>([]);
  // Edit mode for projections
  const [editProjectionId, setEditProjectionId] = useState<string | null>(null);

  // Hourly projection form state
  const [hourlyForm, setHourlyForm] = useState({
    vendor: "",
    month: "",
    commsRate: "",
    engineeringRate: "",
    bugFixesRate: "",
    appTestingRate: "",
    isOverage: false,
  });

  // Change to array of weeks instead of fixed object
  const [weeks, setWeeks] = useState<string[]>([
    "Week 1",
    "Week 2",
    "Week 3",
    "Week 4",
  ]);

  const [weeklyProjects, setWeeklyProjects] = useState<{
    [key: string]: Array<{
      name: string;
      objectives: Array<{
        description: string;
        comms: string;
        engineering: string;
        bugFixes: string;
        appTesting: string;
        assumptions: string[];
      }>;
    }>;
  }>({
    "Week 1": [],
    "Week 2": [],
    "Week 3": [],
    "Week 4": [],
  });
  const [assumptions, setAssumptions] = useState<string[]>([""]);

  // Check URL params for tab and projection on mount
  useEffect(() => {
    const tab = searchParams.get("tab");
    const projectionId = searchParams.get("projection");

    console.log("URL params:", { tab, projectionId }); // Debug log
    console.log("Full URL:", window.location.href); // Debug log
    console.log("Search string:", window.location.search); // Debug log

    if (tab === "approvals") {
      setActiveTab("approvals");
      // Load approvals immediately if coming from notification
      if (projections.length > 0) {
        projections.forEach((proj) => {
          if (!projectionApprovals[proj._id]) {
            loadApprovals(proj._id);
          }
        });
      }
    } else if (tab === "roles") {
      setActiveTab("roles");
    }

    if (projectionId && tab === "approvals") {
      setSelectedProjection(projectionId);
    }
  }, [searchParams]);

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

  const handleEmailProjection = async () => {
    if (!emailProjectionId || emailSelectedUsers.length === 0) {
      alert("Please select at least one user to email");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/projections/${emailProjectionId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: emailSelectedUsers,
          message: emailMessage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        setShowEmailDialog(false);
        setEmailProjectionId(null);
        setEmailSelectedUsers([]);
        setEmailMessage("");
        // Refresh email history for this projection
        loadEmailHistory(emailProjectionId);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Failed to send email");
    } finally {
      setLoading(false);
    }
  };

  const loadEmailHistory = async (projectionId: string) => {
    try {
      const res = await fetch(`/api/projections/${projectionId}/emails`);
      if (res.ok) {
        const data = await res.json();
        setEmailHistory((prev) => ({ ...prev, [projectionId]: data }));
      }
    } catch (error) {
      console.error("Error loading email history:", error);
    }
  };

  const toggleEmailHistory = (projectionId: string) => {
    setShowEmailHistory((prev) => ({
      ...prev,
      [projectionId]: !prev[projectionId],
    }));
    // Load history if not already loaded
    if (!emailHistory[projectionId]) {
      loadEmailHistory(projectionId);
    }
  };

  const openEmailDialog = (projectionId: string) => {
    setEmailProjectionId(projectionId);
    setShowEmailDialog(true);
  };

  const toggleEmailUser = (userId: string) => {
    setEmailSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Feature form
  const [featureForm, setFeatureForm] = useState({
    name: "",
    description: "",
  });

  // Template definitions
  const templates = {
    financial: {
      name: "Financial Projection",
      headers: ["Month", "Revenue", "Expenses", "Net Income", "Cash Flow"],
      defaultRows: 12,
      exampleRow: ["January 2024", "50000", "30000", "20000", "20000"],
    },
    timeline: {
      name: "Project Timeline",
      headers: ["Milestone", "Start Date", "End Date", "Owner", "Status"],
      defaultRows: 5,
      exampleRow: [
        "Phase 1 Planning",
        "2024-01-01",
        "2024-01-31",
        "Team Lead",
        "In Progress",
      ],
    },
    resources: {
      name: "Resource Allocation",
      headers: [
        "Resource Name",
        "Role",
        "Hours/Week",
        "Cost/Hour",
        "Total Cost",
      ],
      defaultRows: 8,
      exampleRow: ["John Doe", "Developer", "40", "75", "3000"],
    },
    metrics: {
      name: "Performance Metrics",
      headers: ["Metric", "Target", "Actual", "Variance", "Notes"],
      defaultRows: 10,
      exampleRow: ["User Signups", "1000", "850", "-15%", "Below target"],
    },
    inventory: {
      name: "Inventory Tracking",
      headers: [
        "Item",
        "SKU",
        "Quantity",
        "Unit Price",
        "Total Value",
        "Location",
      ],
      defaultRows: 15,
      exampleRow: [
        "Widget A",
        "WDG-001",
        "100",
        "25.00",
        "2500",
        "Warehouse 1",
      ],
    },
  };

  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    if (templateKey && templates[templateKey as keyof typeof templates]) {
      const template = templates[templateKey as keyof typeof templates];
      // Initialize with headers and one example row
      const initialRows = [template.headers, template.exampleRow];
      setTemplateRows(initialRows);
      setCsvData(initialRows);
      setProjectionName(template.name);
    }
  };

  const handleAddTemplateRow = () => {
    if (!selectedTemplate) return;
    const template = templates[selectedTemplate as keyof typeof templates];
    const emptyRow = new Array(template.headers.length).fill("");
    setTemplateRows([...templateRows, emptyRow]);
  };

  const handleRemoveTemplateRow = (index: number) => {
    if (index === 0) return; // Don't remove header
    const newRows = templateRows.filter((_, i) => i !== index);
    setTemplateRows(newRows);
    setCsvData(newRows);
  };

  const handleTemplateFieldChange = (
    rowIndex: number,
    colIndex: number,
    value: string
  ) => {
    const newRows = [...templateRows];
    newRows[rowIndex][colIndex] = value;
    setTemplateRows(newRows);
    setCsvData(newRows);
  };

  // Hourly Projection Handlers
  const addProjectToWeek = (week: string) => {
    setWeeklyProjects({
      ...weeklyProjects,
      [week]: [
        ...weeklyProjects[week],
        {
          name: "",
          objectives: [
            {
              description: "",
              comms: "",
              engineering: "",
              bugFixes: "",
              appTesting: "",
              assumptions: [],
            },
          ],
        },
      ],
    });
  };

  const removeProjectFromWeek = (week: string, index: number) => {
    setWeeklyProjects({
      ...weeklyProjects,
      [week]: weeklyProjects[week].filter((_, i) => i !== index),
    });
  };

  const updateWeeklyProject = (
    week: string,
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...weeklyProjects[week]];
    updated[index] = { ...updated[index], [field]: value };
    setWeeklyProjects({
      ...weeklyProjects,
      [week]: updated,
    });
  };

  // Add week handlers
  const addWeek = () => {
    const newWeekNumber = weeks.length + 1;
    const newWeekName = `Week ${newWeekNumber}`;
    setWeeks([...weeks, newWeekName]);
    setWeeklyProjects({
      ...weeklyProjects,
      [newWeekName]: [],
    });
  };

  const removeWeek = (weekName: string) => {
    if (weeks.length <= 1) {
      alert("Must have at least one week");
      return;
    }
    setWeeks(weeks.filter((w) => w !== weekName));
    const newWeeklyProjects = { ...weeklyProjects };
    delete newWeeklyProjects[weekName];
    setWeeklyProjects(newWeeklyProjects);
  };

  // New handlers for objectives
  const addObjectiveToProject = (week: string, projectIndex: number) => {
    const updated = [...weeklyProjects[week]];
    updated[projectIndex].objectives.push({
      description: "",
      comms: "",
      engineering: "",
      bugFixes: "",
      appTesting: "",
      assumptions: [],
    });
    setWeeklyProjects({
      ...weeklyProjects,
      [week]: updated,
    });
  };

  const removeObjectiveFromProject = (
    week: string,
    projectIndex: number,
    objectiveIndex: number
  ) => {
    const updated = [...weeklyProjects[week]];
    updated[projectIndex].objectives = updated[projectIndex].objectives.filter(
      (_, i) => i !== objectiveIndex
    );
    setWeeklyProjects({
      ...weeklyProjects,
      [week]: updated,
    });
  };

  const updateProjectObjective = (
    week: string,
    projectIndex: number,
    objectiveIndex: number,
    field: string,
    value: string
  ) => {
    const updated = [...weeklyProjects[week]];
    updated[projectIndex].objectives[objectiveIndex] = {
      ...updated[projectIndex].objectives[objectiveIndex],
      [field]: value,
    };
    setWeeklyProjects({
      ...weeklyProjects,
      [week]: updated,
    });
  };

  const addObjectiveAssumption = (
    week: string,
    projectIndex: number,
    objectiveIndex: number
  ) => {
    const updated = [...weeklyProjects[week]];
    const currentAssumptions =
      updated[projectIndex].objectives[objectiveIndex].assumptions || [];
    updated[projectIndex].objectives[objectiveIndex].assumptions = [
      ...currentAssumptions,
      "",
    ];
    setWeeklyProjects({
      ...weeklyProjects,
      [week]: updated,
    });
  };

  const removeObjectiveAssumption = (
    week: string,
    projectIndex: number,
    objectiveIndex: number,
    assumptionIndex: number
  ) => {
    const updated = [...weeklyProjects[week]];
    updated[projectIndex].objectives[objectiveIndex].assumptions = updated[
      projectIndex
    ].objectives[objectiveIndex].assumptions.filter(
      (_, i) => i !== assumptionIndex
    );
    setWeeklyProjects({
      ...weeklyProjects,
      [week]: updated,
    });
  };

  const updateObjectiveAssumption = (
    week: string,
    projectIndex: number,
    objectiveIndex: number,
    assumptionIndex: number,
    value: string
  ) => {
    const updated = [...weeklyProjects[week]];
    updated[projectIndex].objectives[objectiveIndex].assumptions[
      assumptionIndex
    ] = value;
    setWeeklyProjects({
      ...weeklyProjects,
      [week]: updated,
    });
  };

  // Assumption handlers
  const addAssumption = () => {
    setAssumptions([...assumptions, ""]);
  };

  const removeAssumption = (index: number) => {
    if (assumptions.length <= 1) {
      alert("Must have at least one assumption");
      return;
    }
    setAssumptions(assumptions.filter((_, i) => i !== index));
  };

  const updateAssumption = (index: number, value: string) => {
    const updated = [...assumptions];
    updated[index] = value;
    setAssumptions(updated);
  };

  const calculateWeekTotals = (week: string) => {
    const projects = weeklyProjects[week];
    let totals = {
      comms: 0,
      engineering: 0,
      bugFixes: 0,
      appTesting: 0,
    };

    projects.forEach((project) => {
      project.objectives.forEach((objective) => {
        totals.comms += parseFloat(objective.comms) || 0;
        totals.engineering += parseFloat(objective.engineering) || 0;
        totals.bugFixes += parseFloat(objective.bugFixes) || 0;
        totals.appTesting += parseFloat(objective.appTesting) || 0;
      });
    });

    return totals;
  };

  const generateHourlyProjectionCSV = () => {
    const csvRows: any[][] = [];

    // Header section
    csvRows.push([
      "",
      "Vendor:",
      hourlyForm.vendor,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    csvRows.push([
      "",
      "Month:",
      hourlyForm.month,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    csvRows.push([]);
    csvRows.push([]);
    csvRows.push([]);

    // Summary section - calculate totals for all weeks dynamically
    const weekTotals = weeks.map((week) => calculateWeekTotals(week));

    const monthlyTotals = {
      comms: weekTotals.reduce((sum, wt) => sum + wt.comms, 0),
      engineering: weekTotals.reduce((sum, wt) => sum + wt.engineering, 0),
      bugFixes: weekTotals.reduce((sum, wt) => sum + wt.bugFixes, 0),
      appTesting: weekTotals.reduce((sum, wt) => sum + wt.appTesting, 0),
    };

    csvRows.push([
      "",
      "Type",
      "Projected Hours Per Week",
      ...weeks.map(() => ""),
      "PROJECTED TOTAL HRS",
      "Hourly ($)",
      "Total ($)",
      "",
      "",
      "",
      "",
    ]);
    csvRows.push([
      "",
      "COMMS",
      ...weeks.map((w) => w.toUpperCase()),
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    csvRows.push([
      "",
      "COMMS",
      ...weekTotals.map((wt) => wt.comms),
      monthlyTotals.comms,
      hourlyForm.commsRate,
      monthlyTotals.comms * (parseFloat(hourlyForm.commsRate) || 0),
      "",
      "",
      "",
      "",
    ]);
    csvRows.push([
      "",
      "ENGINEERING",
      ...weekTotals.map((wt) => wt.engineering),
      monthlyTotals.engineering,
      hourlyForm.engineeringRate,
      monthlyTotals.engineering * (parseFloat(hourlyForm.engineeringRate) || 0),
      "",
      "",
      "",
      "",
    ]);
    csvRows.push([
      "",
      "BUG FIXES",
      ...weekTotals.map((wt) => wt.bugFixes),
      monthlyTotals.bugFixes,
      hourlyForm.bugFixesRate,
      monthlyTotals.bugFixes * (parseFloat(hourlyForm.bugFixesRate) || 0),
      "",
      "",
      "",
      "",
    ]);
    csvRows.push([
      "",
      "APP TESTING",
      ...weekTotals.map((wt) => wt.appTesting),
      monthlyTotals.appTesting,
      hourlyForm.appTestingRate,
      monthlyTotals.appTesting * (parseFloat(hourlyForm.appTestingRate) || 0),
      "",
      "",
      "",
      "",
    ]);
    csvRows.push([]);
    csvRows.push([]);
    csvRows.push([]);
    csvRows.push([]);

    // Weekly sections
    weeks.forEach((weekName, idx) => {
      csvRows.push([
        "",
        `${weekName} - [DATE - DATE]`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
      csvRows.push([
        "",
        "Project Name",
        "Objective / Description",
        "Assumptions",
        "Type",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
      csvRows.push([
        "",
        "",
        "",
        "",
        "COMMS",
        "ENGINEERING",
        "BUG FIXES",
        "APP TESTING",
        "",
        "",
        "",
        "",
        "",
      ]);

      weeklyProjects[weekName].forEach((project) => {
        project.objectives.forEach((objective, objIdx) => {
          csvRows.push([
            "",
            objIdx === 0 ? project.name : "",
            objective.description,
            (objective.assumptions || []).join("\n"),
            objective.comms,
            objective.engineering,
            objective.bugFixes,
            objective.appTesting,
            "",
            "",
            "",
            "",
            "",
          ]);
        });
      });

      // Add empty rows for spacing
      for (
        let i = 0;
        i < Math.max(0, 10 - weeklyProjects[weekName].length);
        i++
      ) {
        csvRows.push(["", "", "", "", "", "", "", "", "", "", "", "", ""]);
      }

      const weekTotal = calculateWeekTotals(weekName);
      csvRows.push([
        "",
        "",
        "",
        `TOTAL ${weekName.toUpperCase()}`,
        weekTotal.comms,
        weekTotal.engineering,
        weekTotal.bugFixes,
        weekTotal.appTesting,
        "",
        "",
        "",
        "",
        "",
      ]);
      csvRows.push([]);
      csvRows.push([]);
    });

    csvRows.push([
      "",
      "",
      "",
      "Projected Monthly Hour Totals:",
      monthlyTotals.comms,
      monthlyTotals.engineering,
      monthlyTotals.bugFixes,
      monthlyTotals.appTesting,
      "",
      "",
      "",
      "",
    ]);
    csvRows.push([]);
    csvRows.push([]);
    csvRows.push([]);

    // Assumptions
    csvRows.push([
      "",
      "Assumptions",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    assumptions.forEach((assumption) => {
      if (assumption.trim()) {
        csvRows.push([
          "",
          assumption,
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          "",
        ]);
      }
    });

    return csvRows;
  };

  const handleCreateOrUpdateHourlyProjection = async () => {
    if (!projectionName || !hourlyForm.vendor || !hourlyForm.month) {
      alert("Please provide projection name, vendor, and month");
      return;
    }
    setLoading(true);
    try {
      const generatedCSV = generateHourlyProjectionCSV();
      const columnCount = generatedCSV.length > 0 ? generatedCSV[0].length : 0;
      const finalName = hourlyForm.isOverage
        ? `${projectionName} - Overage`
        : projectionName;
      const method = editProjectionId ? "PUT" : "POST";
      const url = editProjectionId
        ? `/api/projections/${editProjectionId}`
        : `/api/projects/${projectId}/projections`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalName,
          data: generatedCSV,
          filename: `${finalName}.csv`,
          rowCount: generatedCSV.length,
          columnCount: columnCount,
          isOverage: hourlyForm.isOverage,
          type: projectionType,
        }),
      });
      if (res.ok) {
        const updatedProjection = await res.json();
        if (editProjectionId) {
          setProjections(
            projections.map((p) =>
              p._id === editProjectionId ? updatedProjection : p
            )
          );
          setEditProjectionId(null);
        } else {
          setProjections([updatedProjection, ...projections]);
        }
        setProjectionName("");
        setCsvData([]);
        setCsvFilename("");
        setHourlyForm({
          vendor: "",
          month: "",
          commsRate: "",
          engineeringRate: "",
          bugFixesRate: "",
          appTestingRate: "",
          isOverage: false,
        });
        setWeeks(["Week 1", "Week 2", "Week 3", "Week 4"]);
        setWeeklyProjects({
          "Week 1": [],
          "Week 2": [],
          "Week 3": [],
          "Week 4": [],
        });
        setAssumptions([""]);
        setCreationMode("upload");
        alert(
          editProjectionId
            ? "Hourly projection updated!"
            : "Hourly projection created successfully!"
        );
      } else {
        alert("Failed to save projection");
      }
    } catch (error) {
      console.error("Error saving hourly projection:", error);
      alert("Failed to save projection");
    } finally {
      setLoading(false);
    }
  };

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
          type: projectionType,
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
        const errorData = await res
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("API Error:", errorData);
        alert(
          `Failed to request approvals: ${errorData.error || "Unknown error"}`
        );
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

  const populateHourlyForm = (proj: any) => {
    try {
      if (proj.type) {
        setProjectionType(proj.type);
      }
      const parsed = JSON.parse(proj.data);
      // Parse vendor and month
      const vendor = parsed[0]?.[2] || "";
      const month = parsed[1]?.[2] || "";
      // Parse rates: search for the row with 'Hourly Rates' and grab the next 4 rows
      let commsRate = "";
      let engineeringRate = "";
      let bugFixesRate = "";
      let appTestingRate = "";
      for (let r = 0; r < parsed.length; r++) {
        if (
          parsed[r][1] &&
          typeof parsed[r][1] === "string" &&
          parsed[r][1].toLowerCase().includes("hourly rates")
        ) {
          commsRate = parsed[r + 1]?.[5]?.toString() || "";
          engineeringRate = parsed[r + 2]?.[5]?.toString() || "";
          bugFixesRate = parsed[r + 3]?.[5]?.toString() || "";
          appTestingRate = parsed[r + 4]?.[5]?.toString() || "";
          break;
        }
      }
      // Fallback to old row numbers if not found
      if (!commsRate && parsed[8]?.[5]) commsRate = parsed[8][5].toString();
      if (!engineeringRate && parsed[9]?.[5])
        engineeringRate = parsed[9][5].toString();
      if (!bugFixesRate && parsed[10]?.[5])
        bugFixesRate = parsed[10][5].toString();
      if (!appTestingRate && parsed[11]?.[5])
        appTestingRate = parsed[11][5].toString();

      // Parse isOverage from name or field
      const isOverage = proj.isOverage || /overage/i.test(proj.name);
      setHourlyForm({
        vendor,
        month,
        commsRate:
          commsRate !== undefined && commsRate !== null ? commsRate : "",
        engineeringRate:
          engineeringRate !== undefined && engineeringRate !== null
            ? engineeringRate
            : "",
        bugFixesRate:
          bugFixesRate !== undefined && bugFixesRate !== null
            ? bugFixesRate
            : "",
        appTestingRate:
          appTestingRate !== undefined && appTestingRate !== null
            ? appTestingRate
            : "",
        isOverage,
      });

      // Parse weeks and projects robustly, always include Week 1
      const weekNames: string[] = [];
      const weeklyProjects: any = {};
      let foundWeek1 = false;
      let i = 0;
      // Find first week row
      for (; i < parsed.length; i++) {
        if (parsed[i][1] && /Week 1/.test(parsed[i][1])) {
          foundWeek1 = true;
          break;
        }
      }
      if (!foundWeek1) {
        // If Week 1 not found, default to 4 weeks
        ["Week 1", "Week 2", "Week 3", "Week 4"].forEach((w) => {
          weekNames.push(w);
          weeklyProjects[w] = [];
        });
      } else {
        // Parse all week sections
        i = 0;
        while (i < parsed.length) {
          const row = parsed[i];
          if (row && row[1] && /Week \d+/.test(row[1])) {
            const weekName = row[1].split(" - ")[0];
            if (!weekNames.includes(weekName)) {
              weekNames.push(weekName);
              weeklyProjects[weekName] = [];
            }
            i += 3; // skip headers
            // Parse projects for this week
            while (i < parsed.length) {
              const prow = parsed[i];
              // End of week section
              if (prow && prow[3] && prow[3].toUpperCase().includes("TOTAL")) {
                i++;
                break;
              }
              // Next week section
              if (prow && prow[1] && /Week \d+/.test(prow[1])) {
                break;
              }
              // Skip empty rows
              if (
                !prow ||
                (!prow[1] &&
                  !prow[2] &&
                  !prow[3] &&
                  !prow[4] &&
                  !prow[5] &&
                  !prow[6] &&
                  !prow[7])
              ) {
                i++;
                continue;
              }
              // Parse project name
              const projectName = prow[1] || prow[2] || "";
              // Parse objectives for this project
              const objectives = [];
              let j = i;
              while (j < parsed.length) {
                const orow = parsed[j];
                // End of project or week
                if (
                  (orow &&
                    orow[3] &&
                    orow[3].toUpperCase().includes("TOTAL")) ||
                  (orow && orow[1] && /Week \d+/.test(orow[1]))
                ) {
                  break;
                }
                // Skip empty rows
                if (
                  !orow ||
                  (!orow[1] &&
                    !orow[2] &&
                    !orow[3] &&
                    !orow[4] &&
                    !orow[5] &&
                    !orow[6] &&
                    !orow[7])
                ) {
                  j++;
                  continue;
                }
                // Only push if at least one field is present
                if (orow[2] || orow[4] || orow[5] || orow[6] || orow[7]) {
                  const assumptionStr = orow[3] ? String(orow[3]) : "";
                  objectives.push({
                    description: orow[2] || "",
                    comms: orow[4] || "",
                    engineering: orow[5] || "",
                    bugFixes: orow[6] || "",
                    appTesting: orow[7] || "",
                    assumptions: assumptionStr ? assumptionStr.split("\n") : [],
                  });
                }
                j++;
              }
              if (objectives.length > 0) {
                weeklyProjects[weekName].push({
                  name: projectName,
                  objectives,
                });
              }
              i = j;
            }
          } else {
            i++;
          }
        }
      }
      // Always ensure at least Week 1 exists
      if (!weekNames.includes("Week 1")) {
        weekNames.unshift("Week 1");
        weeklyProjects["Week 1"] = [];
      }
      setWeeks(weekNames);
      setWeeklyProjects(weeklyProjects);

      // Parse assumptions
      const assumptionsStart = parsed.findIndex(
        (row: any[]) =>
          row[1] && (row[1] as string).toLowerCase() === "assumptions"
      );
      const assumptions: string[] = [];
      if (assumptionsStart !== -1) {
        for (let k = assumptionsStart + 1; k < parsed.length; k++) {
          if (parsed[k][1]) {
            assumptions.push(parsed[k][1]);
          }
        }
      }
      setAssumptions(assumptions.length ? assumptions : [""]);
    } catch (e) {
      alert("Failed to parse projection data");
    }
  };

  return (
    <div>
      <div
        style={{ color: "red", fontSize: "12px", marginBottom: "8px" }}
      ></div>
      <div className="border-b-2 border-accent-olive">
        <nav className="-mb-px flex space-x-8">
          {currentUserProjectRole && currentUserProjectRole !== "none" && (
            <button
              onClick={() => setActiveTab("projections")}
              className={`
                ${
                  activeTab === "projections"
                    ? "border-accent-dark-orange text-accent-dark-orange"
                    : "border-transparent text-white hover:border-accent-olive hover:text-accent-light-purple"
                } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors`}
            >
              Projections
            </button>
          )}
          <button
            onClick={() => setActiveTab("approvals")}
            className={`
              ${
                activeTab === "approvals"
                  ? "border-accent-dark-orange text-accent-dark-orange"
                  : "border-transparent text-white hover:border-accent-olive hover:text-accent-light-purple"
              } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors`}
          >
            Approvals
          </button>
          {!(
            currentUserProjectRole === "project_manager" ||
            currentUserProjectRole === "finance_manager"
          ) && (
            <button
              onClick={() => setActiveTab("roles")}
              className={`
                ${
                  activeTab === "roles"
                    ? "border-accent-dark-orange text-accent-dark-orange"
                    : "border-transparent text-white hover:border-accent-olive hover:text-accent-light-purple"
                }
              whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-colors`}
            >
              Roles
            </button>
          )}
        </nav>
      </div>

      <div className="mt-8">
        {activeTab === "projections" && (
          <div className="space-y-8">
            <div className="rounded-lg bg-black p-6 shadow border-2 border-accent-olive">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Add New Projection
              </h3>

              {/* Mode Toggle */}
              <div className="mb-6 flex gap-2">
                <button
                  onClick={() => {
                    setCreationMode("upload");
                    setCsvData([]);
                    setSelectedTemplate("");
                    setTemplateRows([]);
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    creationMode === "upload"
                      ? "bg-accent-dark-orange text-white"
                      : "bg-gray-700 text-white hover:bg-accent-light-purple hover:text-white"
                  }`}
                >
                  Upload CSV
                </button>
                {currentUserProjectRole !== "project_manager" && (
                  <button
                    onClick={() => {
                      setCreationMode("hourly");
                      setCsvData([]);
                      setCsvFilename("");
                      setSelectedTemplate("");
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      creationMode === "hourly"
                        ? "bg-accent-dark-orange text-white"
                        : "bg-gray-700 text-white hover:bg-accent-light-purple hover:text-white"
                    }`}
                  >
                    Hourly Projection
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Projection Type Selector */}
                {currentUserProjectRole !== "project_manager" && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-1">
                      Projection Type
                    </label>
                    <select
                      value={projectionType}
                      onChange={(e) =>
                        setProjectionType(
                          e.target.value as "financial" | "project"
                        )
                      }
                      className="mt-1 block w-full rounded-md border-2 border-accent-olive px-3 py-2 bg-black text-white focus:border-accent-light-purple focus:outline-none"
                    >
                      <option value="financial">Financial Projection</option>
                      <option value="project">Project Projection</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-white">
                    Projection Name
                  </label>
                  <input
                    type="text"
                    value={projectionName}
                    onChange={(e) => setProjectionName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-2 border-accent-olive px-3 py-2 bg-black text-white focus:border-accent-light-purple focus:outline-none"
                  />
                </div>

                {creationMode === "upload" ? (
                  <div>
                    <label className="block text-sm font-medium text-white">
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
                ) : creationMode === "hourly" ? (
                  <div className="space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-900 rounded-md">
                      <div>
                        <label className="block text-xs font-medium text-white mb-1">
                          Vendor
                        </label>
                        <input
                          type="text"
                          value={hourlyForm.vendor}
                          onChange={(e) =>
                            setHourlyForm({
                              ...hourlyForm,
                              vendor: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1 text-sm rounded border-2 border-accent-olive bg-black text-white focus:border-accent-light-purple focus:outline-none"
                          placeholder="Company name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white mb-1">
                          Month
                        </label>
                        <input
                          type="text"
                          value={hourlyForm.month}
                          onChange={(e) =>
                            setHourlyForm({
                              ...hourlyForm,
                              month: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1 text-sm rounded border-2 border-accent-olive bg-black text-white focus:border-accent-light-purple focus:outline-none"
                          placeholder="January 2024"
                        />
                      </div>
                    </div>

                    {/* Hourly Rates */}
                    {projectionType === "financial" && (
                      <div className="p-4 bg-gray-900 rounded-md">
                        <h4 className="text-sm font-semibold text-white mb-3">
                          Hourly Rates ($)
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-white mb-1">
                              COMMS
                            </label>
                            <input
                              type="number"
                              value={hourlyForm.commsRate}
                              onChange={(e) =>
                                setHourlyForm({
                                  ...hourlyForm,
                                  commsRate: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 text-sm rounded border-2 border-accent-olive bg-black text-white focus:border-accent-light-purple focus:outline-none"
                              placeholder="50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white mb-1">
                              ENGINEERING
                            </label>
                            <input
                              type="number"
                              value={hourlyForm.engineeringRate}
                              onChange={(e) =>
                                setHourlyForm({
                                  ...hourlyForm,
                                  engineeringRate: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 text-sm rounded border-2 border-accent-olive bg-black text-white focus:border-accent-light-purple focus:outline-none"
                              placeholder="175"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white mb-1">
                              BUG FIXES
                            </label>
                            <input
                              type="number"
                              value={hourlyForm.bugFixesRate}
                              onChange={(e) =>
                                setHourlyForm({
                                  ...hourlyForm,
                                  bugFixesRate: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 text-sm rounded border-2 border-accent-olive bg-black text-white focus:border-accent-light-purple focus:outline-none"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white mb-1">
                              APP TESTING
                            </label>
                            <input
                              type="number"
                              value={hourlyForm.appTestingRate}
                              onChange={(e) =>
                                setHourlyForm({
                                  ...hourlyForm,
                                  appTestingRate: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 text-sm rounded border-2 border-accent-olive bg-black text-white focus:border-accent-light-purple focus:outline-none"
                              placeholder="75"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Is Overage Checkbox */}
                    <div className="flex items-center gap-2 p-4 bg-gray-900 rounded-md">
                      <input
                        type="checkbox"
                        id="isOverage"
                        checked={hourlyForm.isOverage}
                        onChange={(e) =>
                          setHourlyForm({
                            ...hourlyForm,
                            isOverage: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-accent-dark-orange focus:ring-accent-light-purple"
                      />
                      <label
                        htmlFor="isOverage"
                        className="text-sm font-medium text-white cursor-pointer"
                      >
                        Is Overage
                      </label>
                    </div>

                    {/* Weekly Projects with Add/Remove Week buttons */}
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-semibold text-white">
                        Weekly Breakdown
                      </h4>
                      <button
                        onClick={addWeek}
                        className="text-sm px-4 py-2 rounded-md bg-accent-olive text-white hover:bg-accent-dark-orange"
                      >
                        + Add Week
                      </button>
                    </div>

                    {weeks.map((weekName, weekIdx) => {
                      const weekTotal = calculateWeekTotals(weekName);
                      return (
                        <div
                          key={weekName}
                          className="border-2 border-accent-olive rounded-md p-4"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-semibold text-white">
                              {weekName}
                            </h4>
                            <div className="flex gap-2">
                              <button
                                onClick={() => addProjectToWeek(weekName)}
                                className="text-xs px-3 py-1 rounded-md bg-accent-light-purple text-white hover:bg-accent-dark-orange"
                              >
                                + Add Project
                              </button>
                              {weeks.length > 1 && (
                                <button
                                  onClick={() => removeWeek(weekName)}
                                  className="text-xs px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-700"
                                >
                                  Remove Week
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            {weeklyProjects[weekName].map((project, idx) => (
                              <div
                                key={idx}
                                className="border border-accent-olive rounded-md p-3 bg-gray-900"
                              >
                                <div className="mb-2">
                                  <input
                                    type="text"
                                    value={project.name}
                                    onChange={(e) =>
                                      updateWeeklyProject(
                                        weekName,
                                        idx,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-2 py-1 text-sm rounded border border-accent-olive bg-black text-white focus:border-accent-light-purple focus:outline-none"
                                    placeholder="Project name"
                                  />
                                </div>

                                {/* Multiple Objectives with hours per objective */}
                                <div className="mb-2 space-y-3">
                                  <div className="flex justify-between items-center">
                                    <label className="text-xs font-medium text-white">
                                      Objectives
                                    </label>
                                    <button
                                      onClick={() =>
                                        addObjectiveToProject(weekName, idx)
                                      }
                                      className="text-xs text-accent-light-purple hover:text-accent-dark-orange"
                                    >
                                      + Add Objective
                                    </button>
                                  </div>
                                  {project.objectives.map(
                                    (objective, objIdx) => (
                                      <div
                                        key={objIdx}
                                        className="border-l-2 border-accent-light-purple pl-3 space-y-2"
                                      >
                                        <div className="flex gap-2 items-center">
                                          <input
                                            type="text"
                                            value={objective.description}
                                            onChange={(e) =>
                                              updateProjectObjective(
                                                weekName,
                                                idx,
                                                objIdx,
                                                "description",
                                                e.target.value
                                              )
                                            }
                                            className="flex-1 px-2 py-1 text-sm rounded border border-accent-olive bg-black text-white focus:border-accent-light-purple focus:outline-none"
                                            placeholder={`Objective ${
                                              objIdx + 1
                                            }`}
                                          />
                                          {project.objectives.length > 1 && (
                                            <button
                                              onClick={() =>
                                                removeObjectiveFromProject(
                                                  weekName,
                                                  idx,
                                                  objIdx
                                                )
                                              }
                                              className="text-red-500 hover:text-red-700 text-xs px-2"
                                            >
                                              ✕
                                            </button>
                                          )}
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                          {[
                                            { key: "comms", label: "COMMS" },
                                            {
                                              key: "engineering",
                                              label: "ENG",
                                            },
                                            { key: "bugFixes", label: "BUGS" },
                                            {
                                              key: "appTesting",
                                              label: "TEST",
                                            },
                                          ].map(({ key, label }) => (
                                            <div key={key}>
                                              <label className="block text-xs text-white opacity-70 mb-1">
                                                {label}
                                              </label>
                                              <input
                                                type="number"
                                                value={
                                                  objective[
                                                    key as keyof typeof objective
                                                  ]
                                                }
                                                onChange={(e) =>
                                                  updateProjectObjective(
                                                    weekName,
                                                    idx,
                                                    objIdx,
                                                    key,
                                                    e.target.value
                                                  )
                                                }
                                                className="w-full px-2 py-1 text-xs rounded border border-accent-olive bg-black text-white focus:border-accent-light-purple focus:outline-none"
                                                placeholder="0"
                                              />
                                            </div>
                                          ))}
                                        </div>

                                        {/* Objective Assumptions */}
                                        <div className="mt-2 space-y-2">
                                          <div className="flex justify-between items-center">
                                            <label className="text-xs font-medium text-white opacity-90">
                                              Specific Assumptions
                                            </label>
                                            <button
                                              onClick={() =>
                                                addObjectiveAssumption(
                                                  weekName,
                                                  idx,
                                                  objIdx
                                                )
                                              }
                                              className="text-xs text-accent-light-purple hover:text-accent-dark-orange"
                                            >
                                              + Add
                                            </button>
                                          </div>
                                          {(objective.assumptions || []).map(
                                            (assumption, asmIdx) => (
                                              <div
                                                key={asmIdx}
                                                className="flex gap-2"
                                              >
                                                <input
                                                  type="text"
                                                  value={assumption}
                                                  onChange={(e) =>
                                                    updateObjectiveAssumption(
                                                      weekName,
                                                      idx,
                                                      objIdx,
                                                      asmIdx,
                                                      e.target.value
                                                    )
                                                  }
                                                  className="flex-1 px-2 py-1 text-xs rounded border border-accent-olive bg-black text-white focus:border-accent-light-purple focus:outline-none"
                                                  placeholder="Detail specific assumption..."
                                                />
                                                <button
                                                  onClick={() =>
                                                    removeObjectiveAssumption(
                                                      weekName,
                                                      idx,
                                                      objIdx,
                                                      asmIdx
                                                    )
                                                  }
                                                  className="text-red-500 hover:text-red-700 text-xs px-1"
                                                >
                                                  ✕
                                                </button>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                                <button
                                  onClick={() =>
                                    removeProjectFromWeek(weekName, idx)
                                  }
                                  className="mt-2 text-xs text-red-500 hover:text-red-700"
                                >
                                  Remove Project
                                </button>
                              </div>
                            ))}

                            {weeklyProjects[weekName].length === 0 && (
                              <p className="text-sm text-white opacity-50 text-center py-4">
                                No projects for this week
                              </p>
                            )}
                          </div>

                          {weeklyProjects[weekName].length > 0 && (
                            <div className="mt-3 pt-3 border-t border-accent-olive">
                              <p className="text-xs font-medium text-accent-light-purple">
                                {weekName} Totals: COMMS: {weekTotal.comms}h |
                                ENG: {weekTotal.engineering}h | BUGS:{" "}
                                {weekTotal.bugFixes}h | TEST:{" "}
                                {weekTotal.appTesting}h
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Assumptions */}
                    <div className="border-2 border-accent-olive rounded-md p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-white">
                          Assumptions
                        </h4>
                        <button
                          onClick={addAssumption}
                          className="text-xs px-3 py-1 rounded-md bg-accent-light-purple text-white hover:bg-accent-dark-orange"
                        >
                          + Add Assumption
                        </button>
                      </div>
                      <div className="space-y-2">
                        {assumptions.map((assumption, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="text"
                              value={assumption}
                              onChange={(e) =>
                                updateAssumption(idx, e.target.value)
                              }
                              className="flex-1 px-2 py-1 text-sm rounded border border-accent-olive bg-black text-white focus:border-accent-light-purple focus:outline-none"
                              placeholder="Enter assumption"
                            />
                            <button
                              onClick={() => removeAssumption(idx)}
                              className="text-red-500 hover:text-red-700 text-xs px-2"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Generate/Update Button */}
                    <button
                      onClick={handleCreateOrUpdateHourlyProjection}
                      disabled={loading}
                      className="w-full rounded-md bg-accent-light-purple px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark-orange disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading
                        ? editProjectionId
                          ? "Updating..."
                          : "Saving..."
                        : editProjectionId
                        ? "Update Hourly Projection"
                        : "Save Hourly Projection"}
                    </button>
                  </div>
                ) : null}

                {creationMode === "upload" && (
                  <button
                    onClick={handleAddProjection}
                    disabled={loading}
                    className="rounded-md bg-accent-dark-orange px-4 py-2 text-sm font-medium text-white hover:bg-accent-light-orange disabled:opacity-50"
                  >
                    {loading ? "Adding..." : "Add Projection"}
                  </button>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-white">
                Existing Projections
              </h3>
              {projections.length === 0 ? (
                <p className="text-white opacity-60">No projections yet</p>
              ) : (
                <div className="space-y-4">
                  {(currentUserProjectRole === "project_manager"
                    ? projections.filter((proj) => proj.type !== "financial")
                    : projections
                  ).map((proj) => {
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

                    const isOverage =
                      proj.isOverage || proj.name.includes("- Overage");

                    return (
                      <div
                        key={proj._id}
                        className={`rounded-lg bg-black p-6 shadow border-2 ${
                          isOverage
                            ? "border-accent-dark-orange"
                            : "border-accent-olive"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-white">
                              {proj.name}
                            </h4>
                            {proj.filename && (
                              <p className="text-sm text-accent-light-purple">
                                📁 {proj.filename}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEmailDialog(proj._id)}
                              className="rounded-md bg-accent-olive px-3 py-1 text-xs font-medium text-white hover:bg-accent-dark-orange transition-colors"
                            >
                              📧 Email
                            </button>
                            <button
                              onClick={downloadCsv}
                              className="rounded-md bg-accent-light-purple px-3 py-1 text-xs font-medium text-white hover:bg-accent-dark-orange transition-colors"
                            >
                              Download CSV
                            </button>
                            <button
                              onClick={() => {
                                setCreationMode("hourly");
                                setEditProjectionId(null);
                                setProjectionName(`${proj.name} (Copy)`);
                                populateHourlyForm(proj);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="rounded-md bg-accent-olive px-3 py-1 text-xs font-medium text-white hover:bg-accent-dark-orange transition-colors"
                            >
                              Copy
                            </button>
                            <button
                              onClick={() => {
                                setCreationMode("hourly");
                                setEditProjectionId(proj._id);
                                setProjectionName(
                                  proj.name.replace(/ - Overage$/, "")
                                );
                                populateHourlyForm(proj);
                                // Scroll to top to see logic
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="rounded-md bg-accent-dark-orange px-3 py-1 text-xs font-medium text-white hover:bg-accent-light-orange transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-white opacity-70">
                          {proj.rowCount || data.length} rows ×{" "}
                          {proj.columnCount || columnCount} columns
                        </p>
                        <p className="text-xs text-white opacity-70">
                          Created {new Date(proj.createdAt).toLocaleString()}
                        </p>
                        {data.length > 0 && (
                          <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-accent-olive text-sm">
                              {isArrayFormat ? (
                                <tbody className="divide-y divide-accent-olive bg-black">
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
                                                : "text-white"
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
                                  <tbody className="divide-y divide-accent-olive bg-black">
                                    {Array.isArray(data)
                                      ? data
                                          .slice(0, 10)
                                          .map((row: any, idx: number) => (
                                            <tr key={idx}>
                                              {Object.values(row).map(
                                                (val: any, i: number) => (
                                                  <td
                                                    key={i}
                                                    className="px-4 py-2 text-white"
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
                                          ))
                                      : null}
                                  </tbody>
                                </>
                              )}
                            </table>
                            {data.length > 10 && (
                              <p className="mt-2 text-sm text-white opacity-70">
                                Showing 10 of {data.length} rows
                              </p>
                            )}
                          </div>
                        )}

                        {/* Email History Section */}
                        <div className="mt-4 border-t border-accent-olive pt-4">
                          <button
                            onClick={() => toggleEmailHistory(proj._id)}
                            className="text-sm text-accent-light-purple hover:text-accent-dark-orange font-medium flex items-center gap-2"
                          >
                            {showEmailHistory[proj._id] ? "▼" : "▶"} Email
                            History
                            {emailHistory[proj._id] &&
                              emailHistory[proj._id].length > 0 && (
                                <span className="bg-accent-olive text-white text-xs px-2 py-0.5 rounded-full">
                                  {emailHistory[proj._id].length}
                                </span>
                              )}
                          </button>

                          {showEmailHistory[proj._id] && (
                            <div className="mt-3 space-y-2">
                              {!emailHistory[proj._id] ? (
                                <p className="text-sm text-white opacity-60">
                                  Loading...
                                </p>
                              ) : emailHistory[proj._id].length === 0 ? (
                                <p className="text-sm text-white opacity-60">
                                  No emails sent yet
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {emailHistory[proj._id].map(
                                    (email: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="flex items-start justify-between p-3 bg-black rounded border border-accent-olive"
                                      >
                                        <div>
                                          <span className="text-sm text-white font-semibold">
                                            {email.recipientName ||
                                              email.recipientEmail}
                                          </span>
                                          {email.recipientName && (
                                            <p className="text-xs text-white opacity-60 mt-1">
                                              {email.recipientEmail}
                                            </p>
                                          )}
                                          <p className="text-xs text-white opacity-60 mt-1">
                                            Sent by{" "}
                                            {email.sentByName ||
                                              email.sentByEmail}
                                          </p>
                                          {email.message && (
                                            <p className="text-xs text-white opacity-70 mt-2 italic">
                                              "{email.message}"
                                            </p>
                                          )}
                                          {email.errorMessage && (
                                            <p className="text-xs text-red-500 mt-1">
                                              Error: {email.errorMessage}
                                            </p>
                                          )}
                                        </div>
                                        <span className="text-xs text-white opacity-60 whitespace-nowrap ml-4">
                                          {new Date(
                                            email.createdAt
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "roles" && (
          <RolesTab projectId={projectId} currentUserId={currentUserId} />
        )}

        {activeTab === "approvals" && (
          <div className="space-y-8">
            <div className="rounded-lg bg-black p-6 shadow border-2 border-accent-olive">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Request Approvals
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
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
                    className="block w-full rounded-md border-2 border-accent-olive px-3 py-2 bg-black text-white focus:border-accent-light-purple focus:outline-none"
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
                  <label className="block text-sm font-medium text-white mb-2">
                    Select Users to Approve
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border-2 border-accent-olive rounded-md p-3">
                    {users.length === 0 ? (
                      <p className="text-sm text-white opacity-60">
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
                            <span className="text-sm text-white">
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
              <h3 className="mb-4 text-lg font-semibold text-white">
                All Projection Approvals
              </h3>
              {projections.length === 0 ? (
                <p className="text-white opacity-60">No projections yet</p>
              ) : (
                <div className="space-y-6">
                  {projections.map((proj) => {
                    const approvals = projectionApprovals[proj._id] || [];
                    const isOverage =
                      proj.isOverage || proj.name.includes("- Overage");
                    const borderColor = isOverage
                      ? "border-accent-dark-orange"
                      : "border-accent-olive";

                    return (
                      <div
                        key={proj._id}
                        className={`rounded-lg bg-black p-6 shadow border-2 ${borderColor}`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg text-white">
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
                          <p className="text-sm text-white opacity-60">
                            No approval requests yet
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {(() => {
                              // Group approvals by request number
                              const groupedApprovals = approvals.reduce(
                                (acc: any, approval: any) => {
                                  const reqNum = approval.requestNumber || 1;
                                  if (!acc[reqNum]) acc[reqNum] = [];
                                  acc[reqNum].push(approval);
                                  return acc;
                                },
                                {}
                              );

                              // Sort request numbers descending (latest first)
                              const sortedRequestNumbers = Object.keys(
                                groupedApprovals
                              )
                                .map(Number)
                                .sort((a, b) => b - a);

                              return sortedRequestNumbers.map((reqNum) => {
                                const requestApprovals =
                                  groupedApprovals[reqNum];
                                return (
                                  <div
                                    key={reqNum}
                                    className={`border-2 ${borderColor} rounded-lg p-3`}
                                  >
                                    <h5 className="text-sm font-semibold text-accent-light-purple mb-2">
                                      Request #{reqNum}
                                      {reqNum ===
                                        Math.max(...sortedRequestNumbers) && (
                                        <span className="ml-2 text-xs bg-accent-light-orange text-white px-2 py-0.5 rounded-full">
                                          Latest
                                        </span>
                                      )}
                                    </h5>
                                    <div className="space-y-2">
                                      {requestApprovals
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
                                            a.approvedAt ||
                                            a.rejectedAt ||
                                            a.createdAt;
                                          const bDate =
                                            b.approvedAt ||
                                            b.rejectedAt ||
                                            b.createdAt;
                                          return (
                                            new Date(bDate).getTime() -
                                            new Date(aDate).getTime()
                                          );
                                        })
                                        .map((approval: any) => (
                                          <div
                                            key={approval._id}
                                            className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded border ${borderColor} bg-black gap-3`}
                                          >
                                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                              {approval.user?.image && (
                                                <img
                                                  src={approval.user.image}
                                                  alt={approval.user.name}
                                                  className="w-7 h-7 rounded-full flex-shrink-0"
                                                />
                                              )}
                                              <div className="flex-1 min-w-0">
                                                <p className="font-medium text-xs text-white">
                                                  {approval.user?.name ||
                                                    approval.user?.email ||
                                                    "Unknown User"}
                                                </p>
                                                {approval.comment && (
                                                  <p className="text-xs text-white opacity-70 break-words">
                                                    {approval.comment}
                                                  </p>
                                                )}
                                                <p className="text-xs text-white opacity-60 mt-1">
                                                  {approval.status ===
                                                    "approved" &&
                                                  approval.approvedAt
                                                    ? `Approved ${new Date(
                                                        approval.approvedAt
                                                      ).toLocaleString()}`
                                                    : approval.status ===
                                                        "rejected" &&
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
                                            <div className="flex items-center gap-2 sm:flex-shrink-0">
                                              {approval.userId ===
                                              currentUserId ? (
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
                                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 flex-1 sm:flex-initial ${
                                                      approval.status ===
                                                      "approved"
                                                        ? "bg-accent-olive text-white"
                                                        : "bg-gray-700 text-white hover:bg-accent-olive hover:text-white"
                                                    }`}
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
                                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 flex-1 sm:flex-initial ${
                                                      approval.status ===
                                                      "rejected"
                                                        ? "bg-red-500 text-white"
                                                        : "bg-gray-700 text-white hover:bg-red-500 hover:text-white"
                                                    }`}
                                                  >
                                                    ✗ Reject
                                                  </button>
                                                </>
                                              ) : (
                                                <span
                                                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                                                    approval.status ===
                                                    "approved"
                                                      ? "bg-accent-olive text-white"
                                                      : approval.status ===
                                                        "rejected"
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
                                  </div>
                                );
                              });
                            })()}
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
      </div>

      {/* Email Projection Dialog */}
      {showEmailDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-accent-olive">
            <div className="p-6 border-b border-accent-olive">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-white">
                  📧 Email Projection
                </h3>
                <button
                  onClick={() => {
                    setShowEmailDialog(false);
                    setEmailProjectionId(null);
                    setEmailSelectedUsers([]);
                    setEmailMessage("");
                  }}
                  className="text-white hover:text-accent-dark-orange text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Select Users to Email
                </label>
                {users.length === 0 ? (
                  <p className="text-sm text-white opacity-60">
                    No users available
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto border border-accent-olive rounded-md p-3">
                    {users.map((user: any) => (
                      <label
                        key={user._id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-800 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={emailSelectedUsers.includes(user._id)}
                          onChange={() => toggleEmailUser(user._id)}
                          className="h-4 w-4 rounded border-accent-olive text-accent-olive focus:ring-accent-light-purple"
                        />
                        <div>
                          <p className="text-sm font-medium text-white">
                            {user.name || user.email}
                          </p>
                          {user.name && (
                            <p className="text-xs text-white opacity-60">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-white opacity-70">
                  {emailSelectedUsers.length} user(s) selected
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Optional Message
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={4}
                  placeholder="Add a message to include in the email (optional)"
                  className="w-full rounded-md border-2 border-accent-olive px-3 py-2 bg-black text-white focus:border-accent-light-purple focus:outline-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-accent-olive flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEmailDialog(false);
                  setEmailProjectionId(null);
                  setEmailSelectedUsers([]);
                  setEmailMessage("");
                }}
                disabled={loading}
                className="px-4 py-2 rounded-md border border-accent-olive text-white hover:bg-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEmailProjection}
                disabled={loading || emailSelectedUsers.length === 0}
                className="px-4 py-2 rounded-md bg-accent-olive text-white hover:bg-accent-dark-orange disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
