import { PDFDocument, StandardFonts, rgb, PDFPage } from "pdf-lib";

interface StudentSummary {
  studentId: string;
  studentName: string;
  present: number;
  sick: number;
  excused: number;
  absent: number;
  totalSessions: number;
}

interface SubjectSummary {
  subjectId: string;
  subjectName: string;
  totalSessions: number;
  students: StudentSummary[];
}

interface ClassSummary {
  classId: string;
  className: string;
  subjects: SubjectSummary[];
}

interface PDFData {
  teacherName: string;
  classes: ClassSummary[];
  dateRange?: { from: string; to: string };
}

// Colors
const COLORS = {
  primary: rgb(0.125, 0.698, 0.667),      // #20B2AA
  primaryDark: rgb(0.102, 0.608, 0.576),   // #1A9B93
  ink: rgb(0.102, 0.102, 0.102),           // #1A1A1A
  inkMuted: rgb(0.42, 0.447, 0.471),       // #6B7280
  surface: rgb(0.976, 0.98, 0.984),        // #F9FAFB
  border: rgb(0.902, 0.91, 0.922),         // #E5E7EB
  white: rgb(1, 1, 1),
  green: rgb(0.22, 0.71, 0.30),            // green for present
  yellow: rgb(0.92, 0.70, 0.09),           // yellow for sick
  blue: rgb(0.16, 0.50, 0.87),             // blue for excused
  red: rgb(0.87, 0.25, 0.25),              // red for absent
};

export async function generateAttendancePDF(data: PDFData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await doc.embedFont(StandardFonts.HelveticaOblique);

  const PAGE_WIDTH = 595.28;  // A4
  const PAGE_HEIGHT = 841.89;
  const MARGIN_LEFT = 50;
  const MARGIN_RIGHT = 50;
  const MARGIN_TOP = 50;
  const MARGIN_BOTTOM = 60;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN_TOP;
  let pageNum = 1;

  // ── Helper functions ──

  const addPageNumber = (p: PDFPage, num: number) => {
    p.drawText(`Halaman ${num}`, {
      x: PAGE_WIDTH / 2 - 25,
      y: 30,
      size: 8,
      font,
      color: COLORS.inkMuted,
    });
  };

  const newPage = () => {
    addPageNumber(page, pageNum);
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pageNum++;
    y = PAGE_HEIGHT - MARGIN_TOP;
  };

  const checkPageSpace = (needed: number) => {
    if (y - needed < MARGIN_BOTTOM) {
      newPage();
    }
  };

  const drawText = (
    text: string,
    x: number,
    yPos: number,
    size: number = 10,
    options: {
      bold?: boolean;
      italic?: boolean;
      color?: ReturnType<typeof rgb>;
      maxWidth?: number;
    } = {}
  ) => {
    const { bold = false, italic = false, color = COLORS.ink, maxWidth } = options;
    const f = bold ? boldFont : italic ? italicFont : font;

    // Truncate text if maxWidth is provided
    let displayText = text;
    if (maxWidth) {
      while (f.widthOfTextAtSize(displayText, size) > maxWidth && displayText.length > 0) {
        displayText = displayText.slice(0, -1);
      }
      if (displayText.length < text.length) {
        displayText = displayText.slice(0, -3) + "...";
      }
    }

    page.drawText(displayText, { x, y: yPos, size, font: f, color });
    return yPos;
  };

  const drawRect = (
    x: number,
    yPos: number,
    width: number,
    height: number,
    color: ReturnType<typeof rgb>
  ) => {
    page.drawRectangle({ x, y: yPos - height, width, height, color });
  };

  const drawLine = (
    x1: number,
    yPos: number,
    x2: number,
    thickness: number = 1,
    color: ReturnType<typeof rgb> = COLORS.border
  ) => {
    page.drawLine({
      start: { x: x1, y: yPos },
      end: { x: x2, y: yPos },
      thickness,
      color,
    });
  };

  // ── Document Header ──

  // Header bar
  drawRect(MARGIN_LEFT, y, CONTENT_WIDTH, 4, COLORS.primary);
  y -= 24;

  // Title
  drawText("LAPORAN ABSENSI", MARGIN_LEFT, y, 22, { bold: true, color: COLORS.primary });
  y -= 16;
  drawText("Sistem Absensi Kelas RBIA", MARGIN_LEFT, y, 11, { color: COLORS.inkMuted });
  y -= 24;

  // Divider
  drawLine(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, 1, COLORS.border);
  y -= 20;

  // Info box
  const infoBoxHeight = 60;
  drawRect(MARGIN_LEFT, y, CONTENT_WIDTH, infoBoxHeight, COLORS.surface);
  drawRect(MARGIN_LEFT, y, 3, infoBoxHeight, COLORS.primary); // Left accent

  const infoX = MARGIN_LEFT + 16;
  const infoValueX = MARGIN_LEFT + 120;

  drawText("Guru", infoX, y - 16, 9, { color: COLORS.inkMuted });
  drawText(`: ${data.teacherName}`, infoValueX, y - 16, 9, { bold: true });

  drawText("Tanggal Cetak", infoX, y - 32, 9, { color: COLORS.inkMuted });
  const printDate = data.dateRange
    ? `${data.dateRange.from} — ${data.dateRange.to}`
    : new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
  drawText(`: ${printDate}`, infoValueX, y - 32, 9, { bold: true });

  drawText("Jumlah Kelas", infoX, y - 48, 9, { color: COLORS.inkMuted });
  drawText(`: ${data.classes.length} kelas`, infoValueX, y - 48, 9, { bold: true });

  y -= infoBoxHeight + 24;

  // ── Classes ──

  for (let ci = 0; ci < data.classes.length; ci++) {
    const cls = data.classes[ci];

    checkPageSpace(80);

    // Class header
    drawRect(MARGIN_LEFT, y, CONTENT_WIDTH, 28, COLORS.primary);
    drawText(`KELAS: ${cls.className.toUpperCase()}`, MARGIN_LEFT + 12, y - 18, 12, {
      bold: true,
      color: COLORS.white,
    });
    y -= 40;

    if (cls.subjects.length === 0) {
      drawText("Belum ada mata pelajaran.", MARGIN_LEFT + 12, y, 10, {
        italic: true,
        color: COLORS.inkMuted,
      });
      y -= 24;
      continue;
    }

    for (let si = 0; si < cls.subjects.length; si++) {
      const subject = cls.subjects[si];

      checkPageSpace(80);

      // Subject header
      drawText(`${si + 1}. ${subject.subjectName}`, MARGIN_LEFT, y, 11, { bold: true });
      y -= 14;
      drawText(`${subject.totalSessions} pertemuan selesai`, MARGIN_LEFT + 16, y, 9, {
        color: COLORS.inkMuted,
      });
      y -= 16;

      if (subject.students.length === 0) {
        drawText("Belum ada siswa.", MARGIN_LEFT + 16, y, 10, {
          italic: true,
          color: COLORS.inkMuted,
        });
        y -= 20;
        continue;
      }

      // ── Table ──
      const tableX = MARGIN_LEFT + 8;
      const tableWidth = CONTENT_WIDTH - 16;

      // Column widths (proportional)
      const colWidths = [
        tableWidth * 0.35,  // Nama
        tableWidth * 0.12,  // Hadir
        tableWidth * 0.12,  // Sakit
        tableWidth * 0.12,  // Izin
        tableWidth * 0.12,  // Alpa
        tableWidth * 0.12,  // %
        tableWidth * 0.05,  // spacer
      ];
      const colAlign = ["left", "center", "center", "center", "center", "center", "center"];

      let colX = tableX;
      const colPositions: number[] = [];
      for (let i = 0; i < colWidths.length; i++) {
        colPositions.push(colX);
        colX += colWidths[i];
      }

      // Table header
      const headerHeight = 24;
      drawRect(tableX, y, tableWidth, headerHeight, COLORS.surface);

      const headers = ["Nama Siswa", "Hadir", "Sakit", "Izin", "Alpa", "%"];
      for (let i = 0; i < headers.length; i++) {
        const textX =
          colAlign[i] === "center"
            ? colPositions[i] + colWidths[i] / 2 - font.widthOfTextAtSize(headers[i], 8) / 2
            : colPositions[i] + 8;
        drawText(headers[i], textX, y - 16, 8, { bold: true, color: COLORS.inkMuted });
      }
      y -= headerHeight;

      // Header bottom border
      drawLine(tableX, y, tableX + tableWidth, 1.5, COLORS.primary);
      y -= 2;

      // Student rows
      for (let ri = 0; ri < subject.students.length; ri++) {
        const student = subject.students[ri];
        const rowHeight = 22;

        checkPageSpace(rowHeight + 10);

        // Alternating row background
        if (ri % 2 === 1) {
          drawRect(tableX, y, tableWidth, rowHeight, rgb(0.98, 0.98, 0.98));
        }

        const pct =
          student.totalSessions > 0
            ? Math.round((student.present / student.totalSessions) * 100)
            : 0;

        const values = [
          student.studentName,
          student.present.toString(),
          student.sick.toString(),
          student.excused.toString(),
          student.absent.toString(),
          `${pct}%`,
        ];

        // Color coding for attendance columns
        const valueColors = [
          COLORS.ink,    // name
          COLORS.green,  // present
          COLORS.yellow, // sick
          COLORS.blue,   // excused
          COLORS.red,    // absent
          pct >= 80 ? COLORS.green : pct >= 60 ? COLORS.yellow : COLORS.red, // percentage
        ];

        for (let i = 0; i < values.length; i++) {
          const maxWidth = i === 0 ? colWidths[i] - 16 : colWidths[i] - 8;
          const textX =
            colAlign[i] === "center"
              ? colPositions[i] + colWidths[i] / 2 - font.widthOfTextAtSize(values[i], 9) / 2
              : colPositions[i] + 8;
          drawText(values[i], textX, y - 14, 9, {
            bold: i === 0 || i === 5,
            color: valueColors[i],
            maxWidth,
          });
        }

        y -= rowHeight;

        // Row separator
        drawLine(tableX + 8, y, tableX + tableWidth - 8, 0.5, COLORS.border);
        y -= 2;
      }

      // Table bottom border
      drawLine(tableX, y + 2, tableX + tableWidth, 1, COLORS.border);
      y -= 16;

      // Summary row for this subject
      const totalStudents = subject.students.length;
      const avgPct =
        totalStudents > 0
          ? Math.round(
              subject.students.reduce(
                (sum, s) => sum + (s.totalSessions > 0 ? (s.present / s.totalSessions) * 100 : 0),
                0
              ) / totalStudents
            )
          : 0;

      drawText(
        `Rata-rata kehadiran: ${avgPct}% dari ${totalStudents} siswa`,
        MARGIN_LEFT + 16,
        y,
        8,
        { italic: true, color: COLORS.inkMuted }
      );
      y -= 24;
    }

    // Page break between classes (except last)
    if (ci < data.classes.length - 1) {
      newPage();
    }
  }

  // ── Footer on last page ──
  addPageNumber(page, pageNum);

  // Footer line
  drawLine(MARGIN_LEFT, 50, PAGE_WIDTH - MARGIN_RIGHT, 1, COLORS.border);

  // Footer text
  drawText(
    "Dokumen ini dicetak oleh Sistem Absensi RBIA",
    MARGIN_LEFT,
    36,
    7,
    { italic: true, color: COLORS.inkMuted }
  );

  drawText(
    new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    PAGE_WIDTH - MARGIN_RIGHT - 120,
    36,
    7,
    { color: COLORS.inkMuted }
  );

  return doc.save();
}
