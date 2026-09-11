export type FileKind = "document" | "text" | "pdf" | "sheet" | "folder";

export type VirtualFile = {
  id: string;
  name: string;
  kind: FileKind;
  content: string;
  size: number;
  createdAt: string;
  position: { x: number; y: number };
  generated?: boolean;
};

const now = "2026-09-11T10:30:00.000Z";

export const seedFiles: VirtualFile[] = [
  { id: "project", name: "Project_Report.doc", kind: "document", size: 18432, createdAt: now, position: { x: 28, y: 28 }, content: "PROJECT AURORA — WEEKLY REPORT\n\nStatus: On track\nOwner: You\n\nSummary\nThe prototype is ready for Friday's review. Remaining work: polish the demo, check the projector, and remember which file is actually final.\n\nNext steps\n• Complete interaction testing\n• Prepare a two-minute demo\n• Do not lose this document" },
  { id: "notes", name: "Notes.txt", kind: "text", size: 742, createdAt: now, position: { x: 28, y: 142 }, content: "Things to remember:\n\n- Buy coffee\n- Send project screenshots\n- Never trust a printer that says it is 'thinking'\n- Clean up desktop before the demo" },
  { id: "budget", name: "Budget.xlsx", kind: "sheet", size: 22016, createdAt: now, position: { x: 28, y: 256 }, content: "ITEM | PLANNED | ACTUAL\nSnacks | ₹1,200 | ₹1,840\nCables | ₹800 | ₹799\nEmergency tape | ₹300 | ₹900\nGood decisions | ₹0 | ₹0\nTOTAL | ₹2,300 | ₹3,539" },
  { id: "important", name: "Very_Important.pdf", kind: "pdf", size: 90412, createdAt: now, position: { x: 132, y: 28 }, content: "VERY IMPORTANT DOCUMENT\n\nThis document certifies that the attached information is extremely important.\n\nUnfortunately, the attached information was not attached.\n\nSigned,\nThe Department of Urgent Importance" },
  { id: "photos", name: "Holiday_Photos", kind: "folder", size: 4096, createdAt: now, position: { x: 132, y: 142 }, content: "This folder contains 847 photos, including 312 nearly identical sunsets and one accidental screenshot of the lock screen." },
  { id: "random", name: "Random_Stuff", kind: "folder", size: 4096, createdAt: now, position: { x: 132, y: 256 }, content: "Untitled.png\nold_old_backup.zip\nprobably_useful.txt\nScreenshot 2024-01-12 at 03.17.44.png" },
];

const absurdNames = [
  "Biography_of_Dr_Reginald_Coconut.pdf",
  "The_Psychological_Effects_of_Being_a_Spoon.pdf",
  "Complete_History_of_Nothing_Volume_7.pdf",
  "Minutes_From_Tomorrows_Meeting.doc",
  "Q4_Potato_Risk_Assessment.xlsx",
  "Why_Is_There_A_Folder_Called_Why.pdf",
  "DO_NOT_OPEN.pdf",
  "Definitely_Not_A_Virus.txt",
  "Final_Final_Final_USE_THIS.doc",
  "shopping_list_enterprise_edition.xlsx",
  "The_Complete_Biography_of_Steven_McStevenface.pdf",
  "How_To_Communicate_With_Printer_Spirits.pdf",
  "Performance_Review_Of_An_Employee_Who_Does_Not_Exist.doc",
  "Instructions_For_Operating_A_Spoon.pdf",
  "Taxes_of_the_Republic_of_Bingbong.xlsx",
  "Why_Do_Chairs_Exist.pdf",
  "Q3_Strategic_Potato_Alignment.pptx",
  "Meeting_Minutes_From_A_Meeting_That_Never_Happened.doc",
  "Emergency_Quarterly_Vibes_Report.xlsx",
  "A_Comprehensive_List_of_Lists.doc",
  "Untitled_Final_Actually_Titled.txt",
  "Mandatory_Optional_Training.pdf",
  "Chair_Inventory_Emotional_Status.xlsx",
  "README_But_Please_Do_Not.txt",
  "Forecasting_Yesterdays_Weather.xlsx",
  "The_Annual_Report_Of_No_Year.pdf",
];

const derivatives = ["FINAL", "FINAL_FINAL", "ACTUAL_FINAL", "USE_THIS_ONE", "old_new_version", "Directors_Cut", "Remastered", "Season_2", "But_Longer", "With_Comments_From_Kevin", "v2_REAL", "backup", "copy"];

function kindFor(name: string): FileKind {
  if (name.endsWith(".xlsx")) return "sheet";
  if (name.endsWith(".pdf") || name.endsWith(".pptx")) return "pdf";
  if (name.endsWith(".txt")) return "text";
  return "document";
}

function titleFrom(name: string) { return name.replace(/\.[^.]+$/, "").replaceAll("_", " "); }

function contentFor(name: string, index: number) {
  const title = titleFrom(name);
  const kind = kindFor(name);
  if (kind === "sheet") return `${title.toUpperCase()}\n\nCATEGORY | RISK | SYNERGY | POTATOES\nBaseline operations | Medium | 14% | 3\nStrategic alignment | Crispy | 240% | 17\nUnscheduled feelings | High | N/A | 1\n\nPrepared by the Office of Spreadsheet Decoration`;
  if (name.includes("Minutes") || name.includes("Meeting")) return `${title.toUpperCase()}\n\nAttendees: Nobody present, Kevin (apologies)\nTime: Tomorrow, retrospectively\n\n1. The meeting was called to order before it had been scheduled.\n2. A robust discussion occurred silently.\n3. Kevin accepted all action items by being absent.\n\nNext meeting: Yesterday.`;
  if (name.includes("Instructions") || name.includes("How_To")) return `${title.toUpperCase()}\nCertified Operating Manual · Revision ${index + 4}\n\nCAUTION: Read all instructions before locating the object.\n\nSTEP 1 — Establish eye contact.\nSTEP 2 — Ask for consent in a calm, professional voice.\nSTEP 3 — Proceed with the obvious action.\nSTEP 4 — Complete seventeen pages of compliance paperwork.\n\nTroubleshooting: If the object remains an object, operation was successful.`;
  return `${title.toUpperCase()}\n\nDr. Reginald P. Coconut\nDepartment of Applied Administrative Sciences\n\nABSTRACT\nThis document investigates ${title.toLowerCase()} through an unnecessarily serious multidisciplinary framework. Results indicate a statistically significant amount of paperwork and no measurable benefit.\n\n1. INTRODUCTION\nFor centuries, experts have avoided this subject successfully. This paper ends that proud tradition.\n\n2. FINDINGS\nThe data strongly suggests that more data would make the chart larger.\n\n3. CONCLUSION\nFurther research is urgently unnecessary.`;
}

export function generateGarbage(source: VirtualFile, count: number, attempt: number, existingCount: number): VirtualFile[] {
  const base = source.name.replace(/\.[^.]+$/, "");
  const ext = source.name.includes(".") ? `.${source.name.split(".").pop()}` : ".doc";
  const shuffled = [...absurdNames].sort(() => Math.random() - .5);
  return Array.from({ length: count }, (_, index) => {
    const isDerivative = attempt <= 2 || index < Math.max(2, Math.floor(count * .28));
    const name = isDerivative ? `${base}_${derivatives[(index + attempt * 2) % derivatives.length]}${ext}` : shuffled[index % shuffled.length];
    const sequence = existingCount + index;
    return {
      id: `garbage-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
      name: sequence > 20 && index % 7 === 0 ? name.replace(/(\.[^.]+)$/, `_${sequence}$1`) : name,
      kind: kindFor(name),
      content: contentFor(name, sequence),
      size: 7_000_000 + Math.floor(Math.random() * 6_000_000),
      createdAt: new Date().toISOString(),
      generated: true,
      position: { x: 252 + (sequence % 9) * 98 + Math.random() * 14, y: 22 + (Math.floor(sequence / 9) % 5) * 106 + Math.random() * 12 },
    };
  });
}
