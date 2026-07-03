import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import crypto from "crypto";
import { DbStore } from "./dbStore.js";
import { sendEmail } from "./mailer.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "super_secure_university_portal_key_2026_secret_key_892348923";

const generateSecureToken = (role: string, userId: number): string => {
  const timestamp = Date.now();
  const rawPayload = `${role}-${userId}-${timestamp}`;
  const hmac = crypto.createHmac("sha256", JWT_SECRET).update(rawPayload).digest("hex");
  return `user-token-${role}-${userId}-${timestamp}-${hmac}`;
};

const isPasswordComplex = (password: string): boolean => {
  if (password.length < 10) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
};

function getRenderedEmailTemplate(templateId: string, variables: Record<string, string>): { subject: string; text: string; html: string } {
  const templates = db.getState().emailTemplates || [];
  const template = templates.find(t => t.id === templateId);
  
  let subject = "";
  let text = "";
  let html = "";
  
  if (template) {
    subject = template.subject;
    text = template.text;
    html = template.html;
  } else {
    if (templateId === 'STUDENT_ONBOARDING') {
      subject = "Verify Your University Hub Account";
      text = "Hello {{firstName}},\n\nWelcome to University Hub! Your 6-digit verification code is: {{verificationCode}}\n\nPlease enter this code in the app to activate your account.\n\nBest regards,\nUniversity Hub Admissions Board";
      html = `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;"><h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-top: 0;">Verify Your Account</h2><p>Hello <strong>{{firstName}} {{lastName}}</strong>,</p><p>Welcome to <strong>University Hub</strong>! We are thrilled to have you join our academic portal.</p><p>To finalize your registration and secure your profile, please verify your email address using the 6-digit activation code below:</p><div style="text-align: center; margin: 30px 0;"><span style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 5px; color: #1e3a8a; background: #eff6ff; padding: 12px 30px; border-radius: 8px; border: 1px solid #bfdbfe; display: inline-block;">{{verificationCode}}</span></div><p style="font-size: 13px; color: #64748b;">If you haven't recently signed up for University Hub, please ignore this message.</p><hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" /><p style="font-size: 11px; text-align: center; color: #94a3b8; margin-bottom: 0;">University Hub Admissions & Registrar Board</p></div>`;
    } else if (templateId === 'STAFF_ONBOARDING') {
      subject = "Verify Your University Hub Faculty Account";
      text = "Hello {{firstName}},\n\nWelcome to University Hub Faculty! Your login username (Surname) is: {{generatedUsername}}\nYour temporary password is: {{generatedPassword}}\n\nYour 6-digit verification code is: {{verificationCode}}\n\nPlease enter this code in the app to activate your account.\n\nBest regards,\nUniversity Hub Faculty Board";
      html = `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;"><h2 style="color: #0f766e; border-bottom: 2px solid #0d9488; padding-bottom: 10px; margin-top: 0;">Faculty Hub Verification</h2><p>Hello <strong>Prof. {{firstName}} {{lastName}}</strong>,</p><p>Welcome to <strong>University Hub</strong>! We are thrilled to welcome you to our academic instruction team.</p><p>Your login credentials have been automatically generated as requested:</p><div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; margin: 15px 0;"><p style="margin: 4px 0; font-size: 13px;"><strong>Username (Surname):</strong> <code style="color: #0d9488; font-weight: bold;">{{generatedUsername}}</code></p><p style="margin: 4px 0; font-size: 13px;"><strong>Temporary Password:</strong> <code style="color: #0d9488; font-weight: bold;">{{generatedPassword}}</code></p></div><p>To finalize your registration and secure your profile, please verify your email address using the 6-digit faculty activation code below:</p><div style="text-align: center; margin: 30px 0;"><span style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 5px; color: #0d9488; background: #f0fdfa; padding: 12px 30px; border-radius: 8px; border: 1px solid #ccfbf1; display: inline-block;">{{verificationCode}}</span></div><p style="font-size: 13px; color: #64748b;">If you did not request this verification process, please disregard this email.</p><hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" /><p style="font-size: 11px; text-align: center; color: #94a3b8; margin-bottom: 0;">University Hub Administrative Registrar</p></div>`;
    } else {
      subject = "Reset Your University Hub Credentials";
      text = "Hello {{username}},\n\nA request was completed to reset your security keys on the academic portal. Your security reset authorization code is: {{resetCode}}\n\nPlease input this code to finalize your passcode update.\n\nWarm regards,\nIT Systems & Security Administration";
      html = `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;"><h2 style="color: #651fff; border-bottom: 2px solid #7c4dff; padding-bottom: 10px; margin-top: 0;">Credential Security Reset</h2><p>Hello <strong>{{username}}</strong>,</p><p>We received an inquiry to reset your password. Please authorize this process by inputting the security authorization code below:</p><div style="text-align: center; margin: 30px 0;"><span style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 5px; color: #651fff; background: #f3e5f5; padding: 12px 30px; border-radius: 8px; border: 1px solid #e040fb; display: inline-block;">{{resetCode}}</span></div><p style="font-size: 13px; color: #64748b;">If you did not initiate this request, please contact the support team immediately to secure your credentials.</p><hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" /><p style="font-size: 11px; text-align: center; color: #94a3b8; margin-bottom: 0;">University Hub IT Security Desk</p></div>`;
    }
  }

  const replaceAll = (str: string) => {
    let result = str;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    }
    return result;
  };

  return {
    subject: replaceAll(subject),
    text: replaceAll(text),
    html: replaceAll(html)
  };
}


const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Initialize custom JSON database store
const db = new DbStore();

app.use(express.json());

// Logger middleware for APIs
app.use((req, res, next) => {
  console.log(`[API Request] ${req.method} ${req.url}`);
  next();
});

// Helper type for authenticated request
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    role: 'ADMIN' | 'STAFF' | 'STUDENT';
    studentId?: number; // associated student model primary key
    staffId?: number; // associated staff model primary key
  }
}

// SIMULATED JWT MIDDLEWARE
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.status(401).json({ error: "Missing authentication token" });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token || !token.startsWith('user-token-')) {
    res.status(401).json({ error: "Invalid authentication token format" });
    return;
  }

  try {
    // Simulated token: 'user-token-ROLE-id-timestamp-signature'
    const parts = token.replace('user-token-', '').split('-');
    if (parts.length < 4) {
      res.status(401).json({ error: "Invalid cryptographic token signature format" });
      return;
    }
    const role = parts[0] as 'ADMIN' | 'STAFF' | 'STUDENT';
    const userId = parseInt(parts[1], 10);
    const timestamp = parts[2];
    const clientHmac = parts[3];

    // Recompute signature and verify it
    const rawPayload = `${role}-${userId}-${timestamp}`;
    const expectedHmac = crypto.createHmac("sha256", JWT_SECRET).update(rawPayload).digest("hex");

    if (clientHmac !== expectedHmac) {
      res.status(403).json({ error: "Cryptographic signature validation failed. Token tampering detected!" });
      return;
    }

    const userRecord = db.findUserById(userId);
    if (!userRecord || !userRecord.isActive) {
      res.status(403).json({ error: "User deactivated or not found" });
      return;
    }

    // Validate and update session in backendStorage (DbStore)
    let session = db.getSession(token);
    if (!session) {
      // Create session on-the-fly for backwards compatibility or valid tokens
      db.createSession(token, userId, false);
      session = db.getSession(token);
    }

    if (session) {
      const lastActiveTime = new Date(session.lastActive).getTime();
      const oneWeekAgo = Date.now() - 168 * 60 * 60 * 1000; // 1 week in milliseconds (168 hours)
      
      if (lastActiveTime < oneWeekAgo) {
        db.deleteSession(token);
        res.status(401).json({ error: "Your session has expired due to 1 week of inactivity. Please login again." });
        return;
      }
      
      db.updateSessionActivity(token);
    }

    // Attach contextual information (linking staff/student profile primary key)
    let studentId: number | undefined;
    let staffId: number | undefined;

    if (role === 'STUDENT') {
      const student = db.getState().students.find(s => s.userId === userId);
      if (student) studentId = student.id;
    } else if (role === 'STAFF') {
      const staff = db.getState().staff.find(s => s.userId === userId);
      if (staff) staffId = staff.id;
    }

    req.user = {
      id: userId,
      username: userRecord.username,
      email: userRecord.email,
      role: userRecord.role,
      studentId,
      staffId
    };

    next();
  } catch (err) {
    res.status(403).json({ error: "Token signature verification failed" });
  }
};

// ROLE-BASED AUTHORIZATION MIDDLEWARE
const authorizeRole = (roles: Array<'ADMIN' | 'STAFF' | 'STUDENT'>) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized access" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden. Insufficient role permissions" });
      return;
    }
    next();
  };
};

// --- AUTHENTICATION ENDPOINTS ---
app.post("/api/auth/login", (req: Request, res: Response): void => {
  const { username, password } = req.body;

  if (!username) {
    res.status(400).json({ error: "Username or email is required" });
    return;
  }

  // Find user by username OR email (case-insensitive with trimmed comparison)
  let user = db.getState().users.find(
    u => u.username.trim().toLowerCase() === username.trim().toLowerCase() || u.email.trim().toLowerCase() === username.trim().toLowerCase()
  );

  // If not found, check if it matches a registered student's studentId
  if (!user) {
    const matchedStudent = db.getState().students.find(
      s => s.studentId.trim().toLowerCase() === username.trim().toLowerCase()
    );
    if (matchedStudent && matchedStudent.userId) {
      user = db.getState().users.find(u => u.id === matchedStudent.userId);
    }
  }

  // Or if it matches a registered staff's staffId
  if (!user) {
    const matchedStaff = db.getState().staff.find(
      s => s.staffId.trim().toLowerCase() === username.trim().toLowerCase()
    );
    if (matchedStaff && matchedStaff.userId) {
      user = db.getState().users.find(u => u.id === matchedStaff.userId);
    }
  }

  if (!user) {
    res.status(401).json({ error: "Invalid username, email, ID number, or account inactive" });
    return;
  }

  // Robust password validation:
  // Admin accounts can use custom seeded password or 'password' or defaults ('admin' or 'admin123')
  if (user.role === 'ADMIN') {
    const expectedPassword = user.password || 'admin';
    if (password !== expectedPassword && password !== 'admin' && password !== 'admin123') {
      res.status(401).json({ error: "Incorrect administrator access credentials" });
      return;
    }
  } else {
    const expectedPassword = user.password || 'password';
    if (password !== expectedPassword) {
      res.status(401).json({ error: "Invalid security key credentials" });
      return;
    }
  }

  // Check if account needs email verification
  if (user.isVerified === false) {
    res.status(403).json({
      error: "ACCOUNT_UNVERIFIED",
      message: "Please verify your email address to activate your account",
      username: user.username,
      email: user.email,
      role: user.role
    });
    return;
  }

  // Create simulated token: user-token-ROLE-USERID-TIMESTAMP-HMAC
  const token = generateSecureToken(user.role, user.id);

  // Register session in persistent backendStorage (DbStore)
  const { rememberMe } = req.body;
  db.createSession(token, user.id, rememberMe === true);
  
  // Find contextual profiles
  let profile: any = null;
  if (user.role === 'STUDENT') {
    profile = db.getState().students.find(s => s.userId === user.id);
  } else if (user.role === 'STAFF') {
    profile = db.getState().staff.find(s => s.userId === user.id);
  }

  db.log(user.id, user.username, user.role, 'AUTH_LOGIN', `Successfully logged in. Role: ${user.role}`);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    profile
  });
});

app.post("/api/auth/logout", authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (token) {
      db.deleteSession(token);
    }
  }
  res.json({ message: "Successfully logged out" });
});

app.get("/api/clean-app-tsx", (req: any, res: any): void => {
  res.sendFile(path.join(process.cwd(), "frontend/App.tsx"));
});

app.get("/api/auth/me", authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const profile = req.user!.role === 'STUDENT' 
    ? db.getState().students.find(s => s.id === req.user!.studentId)
    : req.user!.role === 'STAFF'
      ? db.getState().staff.find(s => s.id === req.user!.staffId)
      : null;

  res.json({
    user: req.user,
    profile
  });
});

// --- ADMIN DASHBOARD STATS ---
app.get("/api/admin/stats", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const { startDate, endDate } = req.query;
  const stats = db.getAdminStats(startDate as string | undefined, endDate as string | undefined);
  res.json(stats);
});

app.get("/api/dashboard/stats", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const { startDate, endDate } = req.query;
  const stats = db.getAdminStats(startDate as string | undefined, endDate as string | undefined);
  res.json(stats);
});

// --- STUDENTS SERVICE ---
app.get("/api/students", authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  // Staff & Admin can view all students, Student can only query themselves
  if (req.user!.role === 'STUDENT') {
    const sProfile = db.getState().students.find(s => s.id === req.user!.studentId);
    res.json(sProfile ? [sProfile] : []);
    return;
  }

  const students = db.getStudents();
  // Map enrollments for admin/staff view
  const result = students.map(s => {
    const enrolls = db.getState().studentEnrollments.filter(e => e.studentId === s.id);
    const activeClasses = enrolls.map(e => {
      const cls = db.getState().classes.find(c => c.id === e.classId);
      return cls ? { ...cls, enrollmentStatus: e.status, enrollmentId: e.id } : null;
    }).filter(Boolean);

    return {
      ...s,
      classesDetails: activeClasses
    };
  });

  res.json(result);
});

app.post("/api/students", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const student = db.createStudent(req.body);
    db.log(req.user!.id, req.user!.username, req.user!.role, 'CREATE_STUDENT', `Created student ${student.firstName} ${student.lastName} (${student.studentId})`);
    res.status(201).json(student);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/students/:id/approve", authenticateToken, authorizeRole(['ADMIN', 'STAFF']), (req: AuthenticatedRequest, res: Response): void => {
  const targetId = parseInt(req.params.id, 10);
  const student = db.getState().students.find(s => s.id === targetId);
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  
  if (req.user!.role === 'ADMIN') {
    student.adminApproved = true;
    db.log(req.user!.id, req.user!.username, req.user!.role, 'APPROVE_STUDENT_ADMIN', `Admissions (Admin) approved student admission record ID ${targetId}`);
  } else if (req.user!.role === 'STAFF') {
    student.lecturerApproved = true;
    db.log(req.user!.id, req.user!.username, req.user!.role, 'APPROVE_STUDENT_LECTURER', `Lecturer approved student admission record ID ${targetId}`);
  }

  // Ensure BOTH are approved to activate the student completely
  // Handle fallback to true for newly added fields on existing seed records
  const isApprovedAdmin = student.adminApproved ?? (student.status === 'ACTIVE');
  const isApprovedLecturer = student.lecturerApproved ?? (student.status === 'ACTIVE');

  if (isApprovedAdmin && isApprovedLecturer) {
    student.status = 'ACTIVE';

    // Activate student's cohort enrollments
    const enrollments = db.getState().studentEnrollments.filter(e => e.studentId === targetId);
    enrollments.forEach(e => {
      e.status = 'ACTIVE';
    });
    db.log(req.user!.id, 'SYSTEM', 'SYSTEM', 'ACTIVATE_STUDENT', `Student ID ${targetId} is fully activated and course-ready`);
  } else {
    // If one is approved but not both, remain PENDING_APPROVAL
    student.status = 'PENDING_APPROVAL';
  }

  (db as any).save();
  res.json(student);
});

// GET /api/admissions/pending -> Admin-only, retrieve list of pending students & staff profiles
app.get("/api/admissions/pending", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const pendingStudents = db.getState().students.filter(s => s.status === 'PENDING_APPROVAL');
  const pendingStaff = db.getState().staff.filter(s => s.status === 'PENDING_APPROVAL');
  res.json({
    students: pendingStudents,
    staff: pendingStaff
  });
});

// REJECT student admission
app.put("/api/students/:id/reject", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const targetId = parseInt(req.params.id, 10);
  const student = db.getState().students.find(s => s.id === targetId);
  if (!student) {
    res.status(404).json({ error: "Student profile not found" });
    return;
  }
  student.status = 'WITHDRAWN'; // Or suspended / rejected
  student.adminApproved = false;
  student.lecturerApproved = false;
  
  // also reject associate enrollments
  const enrollments = db.getState().studentEnrollments.filter(e => e.studentId === targetId);
  enrollments.forEach(e => {
    e.status = 'DROPPED';
  });

  (db as any).save();
  db.log(req.user!.id, req.user!.username, req.user!.role, 'REJECT_STUDENT', `Admissions (Admin) rejected student admission record ID ${targetId}`);
  res.json(student);
});

// APPROVE staff / lecturer
app.put("/api/staff/:id/approve", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const targetId = parseInt(req.params.id, 10);
  const staff = db.getState().staff.find(s => s.id === targetId);
  if (!staff) {
    res.status(404).json({ error: "Staff profile not found" });
    return;
  }
  staff.status = 'ACTIVE';

  (db as any).save();
  db.log(req.user!.id, req.user!.username, req.user!.role, 'APPROVE_STAFF', `Admissions approved staff member ID ${targetId} (${staff.firstName} ${staff.lastName})`);
  res.json(staff);
});

// REJECT staff / lecturer
app.put("/api/staff/:id/reject", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const targetId = parseInt(req.params.id, 10);
  const staff = db.getState().staff.find(s => s.id === targetId);
  if (!staff) {
    res.status(404).json({ error: "Staff profile not found" });
    return;
  }
  staff.status = 'TERMINATED';

  (db as any).save();
  db.log(req.user!.id, req.user!.username, req.user!.role, 'REJECT_STAFF', `Admissions rejected/terminated staff member ID ${targetId} (${staff.firstName} ${staff.lastName})`);
  res.json(staff);
});

app.put("/api/students/:id", authenticateToken, authorizeRole(['ADMIN', 'STUDENT']), (req: AuthenticatedRequest, res: Response): void => {
  const targetId = parseInt(req.params.id, 10);

  // If role is STUDENT, they can ONLY update certain fields of their OWN profile
  if (req.user!.role === 'STUDENT' && req.user!.studentId !== targetId) {
    res.status(403).json({ error: "Access denied. Cannot update other student profile." });
    return;
  }

  try {
    let payload = req.body;
    if (req.user!.role === 'STUDENT') {
      // Limit to phone, address, profilePic
      payload = {
        phone: req.body.phone,
        address: req.body.address,
        profilePic: req.body.profilePic
      };
    }

    const updated = db.updateStudent(targetId, payload);
    db.log(req.user!.id, req.user!.username, req.user!.role, 'UPDATE_STUDENT', `Updated student context profile ID ${targetId}`);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/students/:id", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const targetId = parseInt(req.params.id, 10);
  try {
    db.deleteStudent(targetId);
    db.log(req.user!.id, req.user!.username, req.user!.role, 'DELETE_STUDENT', `Hard deleted / suspended student profile record ID ${targetId}`);
    res.json({ message: "Student record deleted successfully" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// View student fee details + billing
app.get("/api/students/:id/fees", authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const targetId = parseInt(req.params.id, 10);

  if (req.user!.role === 'STUDENT' && req.user!.studentId !== targetId) {
    res.status(403).json({ error: "Forbidden. Cannot view other student's tuition ledger." });
    return;
  }

  const student = db.getState().students.find(s => s.id === targetId);
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  // Gather tuition structure based on current class enrollment
  const registrations = db.getState().studentEnrollments.filter(e => e.studentId === targetId);
  
  const ledgers = registrations.map(enroll => {
    const cls = db.getState().classes.find(c => c.id === enroll.classId);
    if (!cls) return null;

    const fee_struct = db.getState().feeStructures.find(fs => fs.classId === enroll.classId);
    const payments = db.getState().feePayments.filter(fp => fp.studentId === targetId && fp.academicYear === cls.academicYear);
    const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);

    return {
      classDetail: cls,
      feeStructure: fee_struct || null,
      paymentsHistory: payments,
      totalPaid,
      dueRemaining: fee_struct ? Math.max(0, fee_struct.totalFees - totalPaid) : 0,
      dueDate: fee_struct ? fee_struct.dueDate : null,
      status: enroll.status
    };
  }).filter(Boolean);

  res.json({
    student,
    ledgers
  });
});

// --- STUDENT COURSEWORK ENDPOINTS ---
app.get("/api/student/my-subjects", authenticateToken, authorizeRole(['STUDENT', 'ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const studentId = req.user!.studentId;
  if (!studentId) {
    res.json([]);
    return;
  }
  const enrolls = db.getState().studentEnrollments.filter(e => e.studentId === studentId && e.status === 'ACTIVE');
  const classIds = enrolls.map(e => e.classId);
  const subjs = db.getState().subjects.filter(s => s.classId !== null && classIds.includes(s.classId!));
  res.json(subjs);
});

app.get("/api/student/my-schedules", authenticateToken, authorizeRole(['STUDENT', 'ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const studentId = req.user!.studentId;
  if (!studentId) {
    res.json([]);
    return;
  }
  const enrolls = db.getState().studentEnrollments.filter(e => e.studentId === studentId && e.status === 'ACTIVE');
  const classIds = enrolls.map(e => e.classId);
  
  const assignments = db.getClassroomAssignments().filter(ca => classIds.includes(ca.classId));
  const detailed = assignments.map(ca => {
    const room = db.getState().classrooms.find(r => r.id === ca.classroomId);
    const cls = db.getState().classes.find(c => c.id === ca.classId);
    const sub = db.getState().subjects.find(s => s.id === ca.subjectId);
    const stf = db.getState().staff.find(s => s.id === ca.staffId);
    return {
      ...ca,
      roomDetails: room || null,
      classDetails: cls || null,
      subjectDetails: sub || null,
      staffDetails: stf ? `${stf.firstName} ${stf.lastName}` : 'Unassigned'
    };
  });
  res.json(detailed);
});

app.get("/api/student/my-attendance", authenticateToken, authorizeRole(['STUDENT', 'ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const studentId = req.user!.studentId;
  if (!studentId) {
    res.json([]);
    return;
  }
  const records = db.getState().attendance.filter(a => a.studentId === studentId);
  res.json(records);
});

// --- STAFF SERVICE ---
app.get("/api/staff", authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  // Staff can query themselves or other staff if staff/admin. Students cannot view salaries or logs.
  if (req.user!.role === 'STUDENT') {
    res.status(403).json({ error: "Students cannot query faculty directories with financial indices." });
    return;
  }

  const staffList = db.getStaff();
  const resList = staffList.map(stf => {
    const salStr = db.getState().salaryStructures.find(ss => ss.staffId === stf.id);
    const payments = db.getState().salaryPayments.filter(sp => sp.staffId === stf.id);
    const allocations = db.getState().staffSubjects.filter(ss => ss.staffId === stf.id).map(ss => {
      const sub = db.getState().subjects.find(s => s.id === ss.subjectId);
      return sub ? { ...sub, allocationId: ss.id, academicYear: ss.academicYear } : null;
    }).filter(Boolean);

    return {
      ...stf,
      salaryStructure: salStr || null,
      paymentsHistory: payments,
      subjectsAllocations: allocations
    };
  });

  res.json(resList);
});

// --- STAFF COURSEWORK ENDPOINTS ---
app.get("/api/staff/my-subjects", authenticateToken, authorizeRole(['STAFF', 'ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const staffId = req.user!.staffId;
  if (!staffId) {
    res.json([]);
    return;
  }
  const allocations = db.getState().staffSubjects.filter(ss => ss.staffId === staffId).map(ss => {
    const sub = db.getState().subjects.find(s => s.id === ss.subjectId);
    return sub ? { ...sub, allocationId: ss.id, academicYear: ss.academicYear } : null;
  }).filter(Boolean);
  res.json(allocations);
});

app.get("/api/staff/my-schedules", authenticateToken, authorizeRole(['STAFF', 'ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const staffId = req.user!.staffId;
  if (!staffId) {
    res.json([]);
    return;
  }
  const assignments = db.getClassroomAssignments().filter(ca => ca.staffId === staffId);
  const detailed = assignments.map(ca => {
    const room = db.getState().classrooms.find(r => r.id === ca.classroomId);
    const cls = db.getState().classes.find(c => c.id === ca.classId);
    const sub = db.getState().subjects.find(s => s.id === ca.subjectId);
    return {
      ...ca,
      roomDetails: room || null,
      classDetails: cls || null,
      subjectDetails: sub || null
    };
  });
  res.json(detailed);
});


// Secure staff profile settings updatable by the logged-in lecturer
app.put("/api/staff/profile/update", authenticateToken, authorizeRole(['STAFF']), (req: AuthenticatedRequest, res: Response): void => {
  const staffId = req.user!.staffId;
  if (!staffId) {
    res.status(404).json({ error: "Staff profile not found linked to this account" });
    return;
  }
  
  const { phone, email, address, profilePic, qualification } = req.body;
  
  const staffList = db.getState().staff;
  const staffIdx = staffList.findIndex(s => s.id === staffId);
  if (staffIdx === -1) {
    res.status(404).json({ error: "Faculty profile not found" });
    return;
  }
  
  const currentStaff = staffList[staffIdx];
  if (phone !== undefined) currentStaff.phone = phone;
  if (address !== undefined) currentStaff.address = address;
  if (profilePic !== undefined) currentStaff.profilePic = profilePic;
  if (qualification !== undefined) currentStaff.qualification = qualification;
  
  if (email && email.toLowerCase() !== currentStaff.email.toLowerCase()) {
    const emailExists = db.getState().users.some(u => u.id !== req.user!.id && u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      res.status(400).json({ error: "This email address is already referenced by another account." });
      return;
    }
    currentStaff.email = email;
    const user = db.getState().users.find(u => u.id === req.user!.id);
    if (user) {
      user.email = email;
    }
  }
  
  (db as any).save();
  db.log(req.user!.id, req.user!.username, req.user!.role, 'UPDATE_STAFF_PROFILE', `Staff program self-updated contact settings for Faculty ID ${currentStaff.staffId}`);
  
  res.json({ message: "Profile settings updated successfully", profile: currentStaff });
});


app.post("/api/staff", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const staff = db.createStaff(req.body);
    db.log(req.user!.id, req.user!.username, req.user!.role, 'CREATE_STAFF', `Registered new faculty ${staff.firstName} ${staff.lastName} (${staff.staffId})`);
    res.status(201).json(staff);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/staff/:id", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const targetId = parseInt(req.params.id, 10);
  try {
    const updated = db.updateStaff(targetId, req.body);
    
    // Also update salary structure if sent
    if (req.body.basicSalary !== undefined) {
      const index = db.getState().salaryStructures.findIndex(ss => ss.staffId === targetId);
      if (index !== -1) {
        db.getState().salaryStructures[index].basicSalary = req.body.basicSalary;
        db.getState().salaryStructures[index].allowances = req.body.allowances ?? db.getState().salaryStructures[index].allowances;
        db.getState().salaryStructures[index].deductions = req.body.deductions ?? db.getState().salaryStructures[index].deductions;
      }
    }

    db.log(req.user!.id, req.user!.username, req.user!.role, 'UPDATE_STAFF', `Updated staff salary data and profile records of ID ${targetId}`);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/staff/:id", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const targetId = parseInt(req.params.id, 10);
  try {
    db.deleteStaff(targetId);
    db.log(req.user!.id, req.user!.username, req.user!.role, 'DELETE_STAFF', `Deallocated and deactivated staff record ID ${targetId}`);
    res.json({ message: "Staff record deleted successfully" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- CLASS ENDPOINTS ---
app.get("/api/classes", authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  // If student is logged in, return classes they are enrolled in
  if (req.user!.role === 'STUDENT') {
    const studentId = req.user!.studentId;
    const enrolls = db.getState().studentEnrollments.filter(e => e.studentId === studentId && e.status === 'ACTIVE');
    const records = db.getState().classes.filter(c => enrolls.some(e => e.classId === c.id));
    res.json(records);
    return;
  }

  // If staff is logged in, return classes for subjects they teach
  if (req.user!.role === 'STAFF') {
    const staffId = req.user!.staffId;
    const staffAllocations = db.getState().staffSubjects.filter(ss => ss.staffId === staffId);
    const assignedSubjectIds = staffAllocations.map(ss => ss.subjectId);
    const assignedSubjects = db.getState().subjects.filter(s => assignedSubjectIds.includes(s.id));
    const linkedClassIds = assignedSubjects.map(s => s.classId).filter((val): val is number => val !== null);
    
    const records = db.getState().classes.filter(c => linkedClassIds.includes(c.id));
    res.json(records);
    return;
  }

  res.json(db.getClasses());
});

app.post("/api/classes", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const record = db.createClass(req.body);
    db.log(req.user!.id, req.user!.username, req.user!.role, 'CREATE_CLASS', `Created class level: ${record.className} - Section ${record.section}`);
    res.status(201).json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/classes/:id", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const record = db.updateClass(parseInt(req.params.id, 10), req.body);
    db.log(req.user!.id, req.user!.username, req.user!.role, 'UPDATE_CLASS', `Updated configurations of class ID ${record.id}`);
    res.json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/classes/:id", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    db.deleteClass(parseInt(req.params.id, 10));
    db.log(req.user!.id, req.user!.username, req.user!.role, 'DELETE_CLASS', `Archived and scrubbed class record ID ${req.params.id}`);
    res.json({ message: "Class deleted successfully" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- SUBJECT ENDPOINTS ---
app.get("/api/subjects", authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  if (req.user!.role === 'STUDENT') {
    // Return subjects of enrolled student classes
    const studentId = req.user!.studentId;
    const enrolls = db.getState().studentEnrollments.filter(e => e.studentId === studentId && e.status === 'ACTIVE');
    const subjs = db.getState().subjects.filter(s => s.classId !== null && enrolls.some(e => e.classId === s.classId));
    res.json(subjs);
    return;
  }

  if (req.user!.role === 'STAFF') {
    const staffId = req.user!.staffId;
    const allocations = db.getState().staffSubjects.filter(ss => ss.staffId === staffId);
    const subjs = db.getState().subjects.filter(s => allocations.some(a => a.subjectId === s.id));
    res.json(subjs);
    return;
  }

  res.json(db.getSubjects());
});

app.post("/api/subjects", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const record = db.createSubject(req.body);
    db.log(req.user!.id, req.user!.username, req.user!.role, 'CREATE_SUBJECT', `Created course subject ${record.subjectName} (${record.subjectCode})`);
    res.status(201).json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/subjects/:id", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const record = db.updateSubject(parseInt(req.params.id, 10), req.body);
    db.log(req.user!.id, req.user!.username, req.user!.role, 'UPDATE_SUBJECT', `Configured academic syllabus details for course ${record.subjectCode}`);
    res.json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/subjects/:id", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    db.deleteSubject(parseInt(req.params.id, 10));
    db.log(req.user!.id, req.user!.username, req.user!.role, 'DELETE_SUBJECT', `Disintegrated subject modules ID ${req.params.id}`);
    res.json({ message: "Subject removed successfully" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Allocate teacher to subject
app.post("/api/staff-subjects", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const { staffId, subjectId, academicYear } = req.body;
  try {
    const record = db.allocateStaffSubject(
      parseInt(staffId, 10),
      parseInt(subjectId, 10),
      academicYear || '2024'
    );
    db.log(req.user!.id, req.user!.username, req.user!.role, 'ALLOCATE_STAFF_SUBJECT', `Allocated subject ID ${subjectId} to Lecturer ID ${staffId}`);
    res.status(201).json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/staff-subjects/:id", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    db.deallocateStaffSubject(parseInt(req.params.id, 10));
    db.log(req.user!.id, req.user!.username, req.user!.role, 'DEALLOCATE_STAFF_SUBJECT', `Revoked classroom lecturer assignment record #${req.params.id}`);
    res.json({ message: "Allocation removed" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- CLASSROOMS & SCHEDULING ---
app.get("/api/classrooms", authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  res.json(db.getClassrooms());
});

app.post("/api/classrooms", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const record = db.createClassroom(req.body);
    db.log(req.user!.id, req.user!.username, req.user!.role, 'CREATE_CLASSROOM', `Added room ${record.roomNumber} under ${record.building}`);
    res.status(201).json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/classrooms/:id", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const record = db.updateClassroom(parseInt(req.params.id, 10), req.body);
    db.log(req.user!.id, req.user!.username, req.user!.role, 'UPDATE_CLASSROOM', `Updated room ${record.roomNumber} capabilities`);
    res.json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/classrooms/:id", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    db.deleteClassroom(parseInt(req.params.id, 10));
    db.log(req.user!.id, req.user!.username, req.user!.role, 'DELETE_CLASSROOM', `Excavated room ${req.params.id} slots`);
    res.json({ message: "Room deleted" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/classroom-assignments", authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const assignments = db.getClassroomAssignments();
  const detailed = assignments.map(ca => {
    const room = db.getState().classrooms.find(r => r.id === ca.classroomId);
    const cls = db.getState().classes.find(c => c.id === ca.classId);
    const sub = db.getState().subjects.find(s => s.id === ca.subjectId);
    const stf = db.getState().staff.find(s => s.id === ca.staffId);
    return {
      ...ca,
      roomDetails: room || null,
      classDetails: cls || null,
      subjectDetails: sub || null,
      staffDetails: stf ? `${stf.firstName} ${stf.lastName}` : 'Unassigned'
    };
  });
  res.json(detailed);
});

app.post("/api/classroom-assignments", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const assignment = db.assignClassroom({
      classroomId: parseInt(req.body.classroomId, 10),
      classId: parseInt(req.body.classId, 10),
      subjectId: parseInt(req.body.subjectId, 10),
      staffId: parseInt(req.body.staffId, 10),
      dayOfWeek: req.body.dayOfWeek,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      academicYear: req.body.academicYear || "2024"
    });
    db.log(req.user!.id, req.user!.username, req.user!.role, 'SCHEDULE_CLASSROOM', `Scheduled room ${assignment.classroomId} for Subject ID ${assignment.subjectId}`);
    res.status(201).json(assignment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/classroom-assignments/:id", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    db.removeClassroomAssignment(parseInt(req.params.id, 10));
    db.log(req.user!.id, req.user!.username, req.user!.role, 'REMOVE_SCHEDULE', `Unscheduled assignment sequence ID ${req.params.id}`);
    res.json({ message: "Schedule assignment rescinded" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- PAYMENTS & ACCOUNTING ---
// Process Student Tuition Fees payment
app.post("/api/payments/fee", authenticateToken, authorizeRole(['ADMIN', 'STUDENT']), (req: AuthenticatedRequest, res: Response): void => {
  const { studentId, amountPaid, paymentMethod, transactionId, remarks, academicYear } = req.body;
  if (!studentId || !amountPaid || !paymentMethod) {
    res.status(400).json({ error: "Missing billing and payment parameters" });
    return;
  }

  const targetStudentId = parseInt(studentId, 10);

  // Security check for student role
  if (req.user!.role === 'STUDENT' && req.user!.studentId !== targetStudentId) {
    res.status(403).json({ error: "Forbidden. Cannot process tuition payment for other student profiles." });
    return;
  }

  try {
    const payment = db.processFeePayment(targetStudentId, {
      amountPaid: parseFloat(amountPaid),
      paymentMethod,
      transactionId: transactionId || `TXN${Date.now().toString().slice(-6)}`,
      remarks: remarks || "",
      academicYear: academicYear || "2024"
    });

    const student = db.getState().students.find(s => s.id === targetStudentId);
    db.log(
      req.user!.id, 
      req.user!.username, 
      req.user!.role, 
      'PROCESS_FEE', 
      `Processed payment $${amountPaid} for Student ${student?.firstName} ${student?.lastName} - Recp: ${payment.receiptNo}`
    );

    res.status(201).json(payment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- MPESA STK PUSH & CALLBACK FLOW ---
interface PendingMpesaTransaction {
  checkoutRequestId: string;
  merchantRequestId: string;
  studentDbId: number;
  schoolId: string;
  phoneNumber: string;
  amount: number;
  remarks: string;
  academicYear: string;
  createdAt: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
}

const pendingMpesaTransactions = new Map<string, PendingMpesaTransaction>();

function processMpesaCallbackLogic(payload: any): any {
  const stkCallback = payload?.Body?.stkCallback;
  if (!stkCallback) {
    throw new Error("Invalid callback payload format: missing stkCallback");
  }

  const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;
  console.log(`[M-Pesa Callback] Received callback for CheckoutRequestID: ${CheckoutRequestID}, ResultCode: ${ResultCode}`);

  const pending = pendingMpesaTransactions.get(CheckoutRequestID);

  if (ResultCode === 0) {
    // Success
    const metadataItems = stkCallback.CallbackMetadata?.Item || [];
    const amountItem = metadataItems.find((item: any) => item.Name === 'Amount');
    const receiptItem = metadataItems.find((item: any) => item.Name === 'MpesaReceiptNumber');
    const phoneItem = metadataItems.find((item: any) => item.Name === 'PhoneNumber');

    const callbackAmount = amountItem?.Value;
    const mpesaReceiptNumber = receiptItem?.Value || `MPX${Math.floor(100000 + Math.random() * 900000)}`;
    const callbackPhone = phoneItem?.Value ? String(phoneItem.Value) : '';

    if (pending) {
      pending.status = 'SUCCESS';
      // Process fee payment in DB
      const payment = db.processFeePayment(pending.studentDbId, {
        amountPaid: pending.amount,
        paymentMethod: 'MPESA',
        transactionId: mpesaReceiptNumber,
        remarks: pending.remarks || `Lipa Na M-Pesa STK push. Paid via ${pending.phoneNumber}`,
        academicYear: pending.academicYear || '2024'
      });

      const student = db.getState().students.find(s => s.id === pending.studentDbId);
      db.log(
        1, // system / admin
        student ? student.firstName : 'M-Pesa Gateway',
        'STUDENT',
        'PROCESS_FEE',
        `Processed M-Pesa payment $${pending.amount} for Student ${student?.firstName} ${student?.lastName} - Recp: ${payment.receiptNo} (STK Push confirmed)`
      );
      return { status: "processed", pending };
    } else {
      // Fallback: lookup student by phone number or find any student with matching phone
      const lookupPhone = callbackPhone || '';
      if (lookupPhone) {
        const cleanedPhone = lookupPhone.slice(-9); // last 9 digits
        const student = db.getState().students.find(s => s.phone && s.phone.replace(/[^0-9]/g, '').endsWith(cleanedPhone));
        if (student) {
          const enrollment = db.getState().studentEnrollments.find(e => e.studentId === student.id);
          const cls = enrollment ? db.getState().classes.find(c => c.id === enrollment.classId) : null;
          const academicYear = cls?.academicYear || '2024';
          const payment = db.processFeePayment(student.id, {
            amountPaid: callbackAmount ? parseFloat(callbackAmount) / 130 : 100, // conversion or default
            paymentMethod: 'MPESA',
            transactionId: mpesaReceiptNumber,
            remarks: `Unsolicited Lipa Na M-Pesa Callback. Paid via ${lookupPhone}`,
            academicYear: academicYear
          });
          db.log(
            1,
            student.firstName,
            'STUDENT',
            'PROCESS_FEE',
            `Processed fallback M-Pesa callback for Student ${student.firstName} ${student.lastName} - Recp: ${payment.receiptNo}`
          );
          return { status: "processed_fallback", studentId: student.id };
        }
      }
      console.warn(`[M-Pesa Callback] No pending transaction or student record found for phone: ${lookupPhone}`);
      return { status: "unmatched" };
    }
  } else {
    // Failure
    if (pending) {
      pending.status = 'FAILED';
      const student = db.getState().students.find(s => s.id === pending.studentDbId);
      db.log(
        1,
        student ? student.firstName : 'M-Pesa Gateway',
        'STUDENT',
        'PROCESS_FEE_FAILED',
        `M-Pesa payment STK push failed/cancelled for Student ${student?.firstName} ${student?.lastName} (${ResultDesc})`
      );
    }
    return { status: "failed", description: ResultDesc };
  }
}

// 1. M-Pesa STK Push Endpoint
app.post("/api/payments/mpesa/stkpush", authenticateToken, authorizeRole(['ADMIN', 'STUDENT']), (req: AuthenticatedRequest, res: Response): void => {
  const { phoneNumber, schoolId, amount, remarks } = req.body;

  if (!phoneNumber || !schoolId || !amount) {
    res.status(400).json({ error: "Missing required STK push parameters (phoneNumber, schoolId, and amount)" });
    return;
  }

  // Find student by alphanumeric studentId or database id
  const targetStudentId = parseInt(schoolId, 10);
  const student = db.getState().students.find(
    s => s.studentId.toLowerCase() === schoolId.trim().toLowerCase() || s.id === targetStudentId
  );

  if (!student) {
    res.status(404).json({ error: `No student registry found matching School ID: "${schoolId}"` });
    return;
  }

  // Validate phone number format (Kenyan numbers)
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (cleanPhone.length < 9) {
    res.status(400).json({ error: "Invalid phone number format. Please provide a valid Safaricom/Kenyan mobile number." });
    return;
  }

  // Fetch student's active cohort class academic period if any
  const enrollment = db.getState().studentEnrollments.find(e => e.studentId === student.id);
  const cls = enrollment ? db.getState().classes.find(c => c.id === enrollment.classId) : null;
  const academicYear = cls?.academicYear || '2024';

  const MerchantRequestID = `MPESA-MRID-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const CheckoutRequestID = `ws_CO_${Date.now().toString().slice(-6)}_${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  const pendingTx: PendingMpesaTransaction = {
    checkoutRequestId: CheckoutRequestID,
    merchantRequestId: MerchantRequestID,
    studentDbId: student.id,
    schoolId: student.studentId,
    phoneNumber: phoneNumber,
    amount: parseFloat(amount),
    remarks: remarks || `Tuition Payment via M-Pesa STK - ${student.studentId}`,
    academicYear: academicYear,
    createdAt: Date.now(),
    status: 'PENDING'
  };

  pendingMpesaTransactions.set(CheckoutRequestID, pendingTx);

  db.log(
    req.user!.id,
    req.user!.username,
    req.user!.role,
    'MPESA_STK_PUSH_INIT',
    `Initiated Lipa Na M-Pesa STK push of $${amount} to ${phoneNumber} for student ${student.firstName} ${student.lastName}`
  );

  // Simulated push timing: auto-resolve in 3 seconds to update database and give realistic callback confirmation
  setTimeout(() => {
    try {
      const mockCallbackPayload = {
        Body: {
          stkCallback: {
            MerchantRequestID,
            CheckoutRequestID,
            ResultCode: 0,
            ResultDesc: "The service request is processed successfully.",
            CallbackMetadata: {
              Item: [
                { Name: "Amount", Value: amount },
                { Name: "MpesaReceiptNumber", Value: `MPX${crypto.randomBytes(4).toString('hex').toUpperCase()}` },
                { Name: "TransactionDate", Value: parseInt(new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14), 10) },
                { Name: "PhoneNumber", Value: parseInt(cleanPhone, 10) }
              ]
            }
          }
        }
      };
      processMpesaCallbackLogic(mockCallbackPayload);
    } catch (err) {
      console.error("Error in simulated callback background execution:", err);
    }
  }, 3000);

  // Return standard Safaricom API response
  res.status(200).json({
    MerchantRequestID,
    CheckoutRequestID,
    ResponseCode: "0",
    ResponseDescription: "Success. Request accepted for processing",
    CustomerMessage: "Single STK Push prompt successfully sent to your mobile device. Enter M-Pesa PIN to complete payment."
  });
});

// 2. M-Pesa Callback Webhook (Public, no JWT requirement)
app.post("/api/payments/mpesa/callback", (req: Request, res: Response): void => {
  try {
    const result = processMpesaCallbackLogic(req.body);
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Callback processed successfully",
      detail: result
    });
  } catch (err: any) {
    console.error("[M-Pesa Callback Error]", err);
    res.status(400).json({
      ResultCode: 1,
      ResultDesc: err.message || "Failed to process callback"
    });
  }
});

// 3. M-Pesa Transaction Status Query Endpoint
app.get("/api/payments/mpesa/status/:checkoutRequestId", authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const { checkoutRequestId } = req.params;
  const pending = pendingMpesaTransactions.get(checkoutRequestId);

  if (!pending) {
    res.status(404).json({ error: "No transaction found matching that CheckoutRequestID" });
    return;
  }

  res.status(200).json({
    checkoutRequestId: pending.checkoutRequestId,
    merchantRequestId: pending.merchantRequestId,
    status: pending.status,
    amount: pending.amount,
    schoolId: pending.schoolId,
    phoneNumber: pending.phoneNumber
  });
});

// Fee structure updates
app.post("/api/fee-structure", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const configured = db.configureFeeStructure({
      classId: parseInt(req.body.classId, 10),
      academicYear: req.body.academicYear,
      totalFees: parseFloat(req.body.totalFees),
      admissionFee: parseFloat(req.body.admissionFee || 0),
      tuitionFee: parseFloat(req.body.tuitionFee),
      libraryFee: parseFloat(req.body.libraryFee || 0),
      sportsFee: parseFloat(req.body.sportsFee || 0),
      dueDate: req.body.dueDate,
      lateFeePenalty: parseFloat(req.body.lateFeePenalty || 0)
    });
    db.log(req.user!.id, req.user!.username, req.user!.role, 'SET_FEE_STRUCTURE', `Configured primary fee structure for class level ID ${req.body.classId}`);
    res.status(201).json(configured);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Process Staff Payroll
app.post("/api/payments/salary", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const { staffId, amount, month, year, paymentMethod, transactionId } = req.body;
  if (!staffId || !amount || !month || !year || !paymentMethod) {
    res.status(400).json({ error: "Missing essential payroll arguments" });
    return;
  }

  try {
    const payment = db.processSalaryPayment(parseInt(staffId, 10), {
      amount: parseFloat(amount),
      month: parseInt(month, 10),
      year: parseInt(year, 10),
      paymentMethod,
      transactionId: transactionId || `PAY${Date.now().toString().slice(-6)}`
    });

    const staffMember = db.getState().staff.find(s => s.id === parseInt(staffId, 10));
    db.log(
      req.user!.id, 
      req.user!.username, 
      req.user!.role, 
      'PROCESS_SALARY', 
      `Disbursed salary $${amount} to Faculty ${staffMember?.firstName} ${staffMember?.lastName} for Period: ${month}/${year}`
    );

    res.status(201).json(payment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- GRADING / ACADEMIC ENTRIES ---
app.get("/api/grades", authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const { studentId, subjectId } = req.query;

  // Student can ONLY query their own grades
  if (req.user!.role === 'STUDENT') {
    const results = db.getState().grades.filter(g => g.studentId === req.user!.studentId);
    const finished = results.map(r => {
      const subject = db.getState().subjects.find(s => s.id === r.subjectId);
      return {
        ...r,
        subjectDetails: subject || null
      };
    });
    res.json(finished);
    return;
  }

  // Admin/Staff querying grades
  let results = db.getState().grades;
  if (studentId) {
    results = results.filter(g => g.studentId === parseInt(studentId as string, 10));
  }
  if (subjectId) {
    results = results.filter(g => g.subjectId === parseInt(subjectId as string, 10));
  }

  const finished = results.map(r => {
    const student = db.getState().students.find(s => s.id === r.studentId);
    const subject = db.getState().subjects.find(s => s.id === r.subjectId);
    return {
      ...r,
      studentDetails: student || null,
      subjectDetails: subject || null
    };
  });

  res.json(finished);
});

app.post("/api/grades", authenticateToken, authorizeRole(['ADMIN', 'STAFF']), (req: AuthenticatedRequest, res: Response): void => {
  const { studentId, subjectId, marksObtained, totalMarks, grade, examType, academicYear } = req.body;
  if (!studentId || !subjectId || marksObtained === undefined || !grade || !examType) {
    res.status(400).json({ error: "Missing essential grading arguments" });
    return;
  }

  try {
    const record = db.updateGrade(
      parseInt(studentId, 10),
      parseInt(subjectId, 10),
      {
        marksObtained: parseFloat(marksObtained),
        totalMarks: totalMarks ? parseFloat(totalMarks) : 100,
        grade,
        examType,
        academicYear: academicYear || "2024"
      }
    );

    const studentObj = db.getState().students.find(s => s.id === parseInt(studentId, 10));
    db.log(
      req.user!.id, 
      req.user!.username, 
      req.user!.role, 
      'SUBMIT_GRADE', 
      `Submitted Grade ${grade} (${marksObtained} marks) for Student ${studentObj?.firstName} ${studentObj?.lastName}`
    );

    res.status(201).json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- ATTENDANCE SERVICE ---
app.get("/api/attendance", authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const { subjectId, date } = req.query;

  let records = db.getState().attendance;
  if (subjectId) {
    records = records.filter(a => a.subjectId === parseInt(subjectId as string, 10));
  }
  if (date) {
    records = records.filter(a => a.date === date);
  }

  res.json(records);
});

app.post("/api/attendance", authenticateToken, authorizeRole(['ADMIN', 'STAFF']), (req: AuthenticatedRequest, res: Response): void => {
  const { studentId, subjectId, date, status } = req.body;
  if (!studentId || !subjectId || !date || !status) {
    res.status(400).json({ error: "Missing attendance marking criteria" });
    return;
  }

  try {
    const record = db.saveAttendance(
      parseInt(studentId, 10),
      parseInt(subjectId, 10),
      date,
      status
    );
    res.json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- USER MANAGEMENT LOGS (Admin reporting) ---
app.get("/api/logs", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  res.json(db.getState().logs);
});

// --- ADMIN USER ACCOUNTS MANAGEMENT ---
app.get("/api/admin/users", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const users = db.getAllUsers().map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt
  }));
  res.json(users);
});

app.get("/api/admin/email-templates", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const templates = db.getState().emailTemplates || [];
  res.json(templates);
});

app.put("/api/admin/email-templates/:id", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const { id } = req.params;
  const { subject, text, html } = req.body;

  if (!subject || !text || !html) {
    res.status(400).json({ error: "Missing required fields (subject, text, html)" });
    return;
  }

  const templates = db.getState().emailTemplates || [];
  const template = templates.find(t => t.id === id);

  if (!template) {
    res.status(404).json({ error: "Email template not found" });
    return;
  }

  template.subject = subject;
  template.text = text;
  template.html = html;

  (db as any).save();

  db.log(req.user!.id, req.user!.username, req.user!.role, 'EDIT_EMAIL_TEMPLATE', `Admin updated email template: ${id}`);

  res.json({ message: "Email template updated successfully", template });
});

app.post("/api/admin/users/:id/lockout", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const targetId = parseInt(req.params.id, 10);
  const { locked } = req.body;
  if (typeof locked !== 'boolean') {
    res.status(400).json({ error: "Missing or invalid 'locked' parameter" });
    return;
  }

  if (targetId === req.user!.id) {
    res.status(400).json({ error: "Self-lockout precaution: Admins are not permitted to lock out their own account!" });
    return;
  }

  const success = db.setUserActiveState(targetId, !locked);
  if (!success) {
    res.status(404).json({ error: "User account not found" });
    return;
  }

  const userRecord = db.findUserById(targetId);
  const actionLabel = locked ? 'LOCKOUT_USER' : 'UNLOCK_USER';
  const descLabel = locked ? 'locked out / suspended' : 're-activated';
  db.log(req.user!.id, req.user!.username, req.user!.role, actionLabel, `Admin manually ${descLabel} user ID ${targetId} (${userRecord?.username})`);

  res.json({ message: `User account has been successfully ${descLabel}.` });
});

app.post("/api/admin/users/:id/reset-email", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const targetId = parseInt(req.params.id, 10);
  const userRecord = db.findUserById(targetId);
  if (!userRecord) {
    res.status(404).json({ error: "User account not found" });
    return;
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  userRecord.resetCode = resetCode;
  (db as any).save();

  db.log(req.user!.id, req.user!.username, req.user!.role, 'ADMIN_FORCE_PASSWORD_RESET_EMAIL', `Admin triggered manual password reset dispatch for user ID ${targetId} (${userRecord.username})`);

  // Send the email
  sendEmail({
    to: userRecord.email,
    subject: "Security Notification: Password Reset Initiated by University Administration",
    text: `Hello ${userRecord.username},\n\nAn administrator has initiated a password reset sequence on your account for security operations. Your security reset code is:\n\n${resetCode}\n\nPlease visit the portal login screen, click "Forgot Password", and complete the verification using this authorization code.\n\nWarm regards,\nIT Systems & Security Administration`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff;">
        <h2 style="color: #ef4444; border-bottom: 2px solid #ef4444; padding-bottom: 10px; margin-top: 0;">Administrative Security Reset</h2>
        <p>Hello <strong>${userRecord.username}</strong>,</p>
        <p>A system administrator has triggered a credential security reset workflow on your account. To complete the credential re-authorization, use the reset code below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 5px; color: #ef4444; background: #fef2f2; padding: 12px 30px; border-radius: 8px; border: 1px solid #fee2e2; display: inline-block;">
            ${resetCode}
          </span>
        </div>
        <p style="font-size: 13px; color: #64748b;">Please proceed to the login page of the University Hub, choose "Forgot Password / Reset Credentials", enter your username (${userRecord.username}) and registered backup/institutional email, and input this code along with your new secure passcode.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; text-align: center; color: #94a3b8; margin-bottom: 0;">University Hub Administrative Division</p>
      </div>
    `
  }).catch(err => console.error("Error sending admin reset email:", err));

  res.json({
    message: "Administrative reset code dispatched successfully to the user's primary/registered email address."
  });
});

// --- ADMIN REPORTS SPECIFIC FILTERS QUERY ---
app.get("/api/admin/reports", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const { type, academicYear, classId, examType, subjectId, month, year, status, startDate, endDate } = req.query;

  try {
    const state = db.getState();

    if (type === 'enrollment') {
      const studentsList = [...state.students];
      const details = studentsList.map(s => {
        const enrollments = state.studentEnrollments.filter(se => se.studentId === s.id);
        const activeEnr = enrollments.find(se => se.status === 'ACTIVE') || enrollments[0];
        const cls = activeEnr ? state.classes.find(c => c.id === activeEnr.classId) : null;
        
        return {
          id: s.id,
          studentId: s.studentId,
          firstName: s.firstName,
          lastName: s.lastName,
          email: s.email,
          phone: s.phone,
          status: s.status,
          enrollmentDate: s.enrollmentDate,
          className: cls ? `${cls.className} (${cls.section})` : 'Unassigned',
          classId: cls ? cls.id : null,
          academicYear: cls ? cls.academicYear : null
        };
      });

      let filtered = details;
      if (classId) {
        filtered = filtered.filter(f => f.classId === parseInt(classId as string, 10));
      }
      if (academicYear) {
        filtered = filtered.filter(f => f.academicYear === academicYear as string);
      }
      if (status) {
        filtered = filtered.filter(f => f.status === status as string);
      }
      if (startDate) {
        filtered = filtered.filter(f => f.enrollmentDate >= (startDate as string));
      }
      if (endDate) {
        filtered = filtered.filter(f => f.enrollmentDate <= (endDate as string));
      }
      
      res.json(filtered);
      return;
    }

    if (type === 'fees') {
      const payments = [...state.feePayments];
      const details = payments.map(p => {
        const student = state.students.find(s => s.id === p.studentId);
        const name = student ? `${student.firstName} ${student.lastName}` : `Student #${p.studentId}`;
        const enroll = state.studentEnrollments.find(e => e.studentId === p.studentId && e.status === 'ACTIVE');
        const cls = enroll ? state.classes.find(c => c.id === enroll.classId) : null;
        const feeStruct = cls ? state.feeStructures.find(fs => fs.classId === cls.id) : null;

        return {
          id: p.id,
          receiptNo: p.receiptNo,
          studentName: name,
          studentId: student ? student.studentId : 'N/A',
          amountPaid: p.amountPaid,
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
          transactionId: p.transactionId,
          remarks: p.remarks,
          academicYear: p.academicYear,
          className: cls ? `${cls.className} (${cls.section})` : 'N/A',
          classId: cls ? cls.id : null,
          totalFees: feeStruct ? feeStruct.totalFees : 0
        };
      });

      let filtered = details;
      if (classId) {
        filtered = filtered.filter(f => f.classId === parseInt(classId as string, 10));
      }
      if (academicYear) {
        filtered = filtered.filter(f => f.academicYear === academicYear as string);
      }
      if (startDate) {
        filtered = filtered.filter(f => f.paymentDate >= (startDate as string));
      }
      if (endDate) {
        filtered = filtered.filter(f => f.paymentDate <= (endDate as string));
      }
      
      res.json(filtered);
      return;
    }

    if (type === 'salaries') {
      const payments = [...state.salaryPayments];
      const details = payments.map(p => {
        const staff = state.staff.find(st => st.id === p.staffId);
        const name = staff ? `${staff.firstName} ${staff.lastName}` : `Staff #${p.staffId}`;
        const structure = state.salaryStructures.find(ss => ss.staffId === p.staffId);

        return {
          id: p.id,
          staffIdCode: staff ? staff.staffId : 'N/A',
          staffName: name,
          department: staff ? staff.department : 'N/A',
          amount: p.amount,
          month: p.month,
          year: p.year,
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
          transactionId: p.transactionId,
          status: p.status,
          basicSalary: structure ? structure.basicSalary : p.amount,
          allowances: structure ? structure.allowances : 0,
          deductions: structure ? structure.deductions : 0
        };
      });

      let filtered = details;
      if (month) {
        filtered = filtered.filter(f => f.month === parseInt(month as string, 10));
      }
      if (year) {
        filtered = filtered.filter(f => f.year === parseInt(year as string, 10));
      }
      if (startDate) {
        filtered = filtered.filter(f => f.paymentDate >= (startDate as string));
      }
      if (endDate) {
        filtered = filtered.filter(f => f.paymentDate <= (endDate as string));
      }
      
      res.json(filtered);
      return;
    }

    if (type === 'grades') {
      const gradesList = [...state.grades];
      const details = gradesList.map(g => {
        const student = state.students.find(s => s.id === g.studentId);
        const subject = state.subjects.find(s => s.id === g.subjectId);
        const cls = subject ? state.classes.find(c => c.id === subject.classId) : null;
        
        return {
          id: g.id,
          studentName: student ? `${student.firstName} ${student.lastName}` : `Student #${g.studentId}`,
          studentIdCode: student ? student.studentId : 'N/A',
          subjectName: subject ? subject.subjectName : 'N/A',
          subjectCode: subject ? subject.subjectCode : 'N/A',
          marksObtained: g.marksObtained,
          totalMarks: g.totalMarks,
          grade: g.grade,
          examType: g.examType,
          academicYear: g.academicYear,
          className: cls ? `${cls.className} (${cls.section})` : 'N/A',
          classId: cls ? cls.id : null,
          subjectId: g.subjectId
        };
      });

      let filtered = details;
      if (classId) {
        filtered = filtered.filter(f => f.classId === parseInt(classId as string, 10));
      }
      if (subjectId) {
        filtered = filtered.filter(f => f.subjectId === parseInt(subjectId as string, 10));
      }
      if (examType) {
        filtered = filtered.filter(f => f.examType === examType as string);
      }
      if (academicYear) {
        filtered = filtered.filter(f => f.academicYear === academicYear as string);
      }
      if (startDate) {
        const startYearStr = (startDate as string).split('-')[0];
        filtered = filtered.filter(f => !f.academicYear || f.academicYear >= startYearStr);
      }
      if (endDate) {
        const endYearStr = (endDate as string).split('-')[0];
        filtered = filtered.filter(f => !f.academicYear || f.academicYear <= endYearStr);
      }
      
      res.json(filtered);
      return;
    }

    res.status(400).json({ error: "Invalid report type" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- ENROLLMENTS MANAGEMENT ---
app.post("/api/enrollment", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const { studentId, classId } = req.body;
  try {
    const record = db.enrollStudentInClass(parseInt(studentId, 10), parseInt(classId, 10));
    const student = db.getState().students.find(s => s.id === parseInt(studentId, 10));
    db.log(req.user!.id, req.user!.username, req.user!.role, 'ENROLL_STUDENT', `Enrolled Student ${student?.firstName} ${student?.lastName} in Class Id ${classId}`);
    res.status(201).json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/enrollment/:id", authenticateToken, authorizeRole(['ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  try {
    const record = db.updateEnrollmentStatus(parseInt(req.params.id, 10), req.body.status);
    db.log(req.user!.id, req.user!.username, req.user!.role, 'UPDATE_ENROLLMENT', `Modified enrollment state to ${req.body.status} on assignment ID ${req.params.id}`);
    res.json(record);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- REVERSIBLE CSV/JSON REPORT GENERATOR EXPORT ---
app.get("/api/reports/download", authenticateToken, (req: AuthenticatedRequest, res: Response): void => {
  const { type } = req.query; // 'audit_logs' | 'fee_payments' | 'salary_payments' | 'student_grades'

  // Standard plain text CSV header and body generation
  let filename = "report.csv";
  let csvContent = "";

  if (type === 'audit_logs') {
    filename = "system_audit_logs.csv";
    csvContent = "ID,Timestamp,User,Role,Action,Details\n";
    db.getState().logs.forEach(l => {
      csvContent += `"${l.id}","${l.timestamp}","${l.username}","${l.role}","${l.action}","${l.details.replace(/"/g, '""')}"\n`;
    });
  } else if (type === 'fee_payments') {
    filename = "student_fee_payments.csv";
    csvContent = "Receipt No,Student Name,Amount Paid,Payment Date,Method,Transaction ID,Remarks\n";
    db.getState().feePayments.forEach(fp => {
      const std = db.getState().students.find(s => s.id === fp.studentId);
      const name = std ? `${std.firstName} ${std.lastName}` : `Student #${fp.studentId}`;
      csvContent += `"${fp.receiptNo}","${name}","${fp.amountPaid}","${fp.paymentDate}","${fp.paymentMethod}","${fp.transactionId}","${fp.remarks.replace(/"/g, '""')}"\n`;
    });
  } else if (type === 'salary_payments') {
    filename = "staff_salary_ledger.csv";
    csvContent = "ID,Staff Member,Amount,Month,Year,Payment Date,Method,Transaction ID,Status\n";
    db.getState().salaryPayments.forEach(sp => {
      const st = db.getState().staff.find(s => s.id === sp.staffId);
      const name = st ? `${st.firstName} ${st.lastName}` : `Staff #${sp.staffId}`;
      csvContent += `"${sp.id}","${name}","${sp.amount}","${sp.month}","${sp.year}","${sp.paymentDate}","${sp.paymentMethod}","${sp.transactionId}","${sp.status}"\n`;
    });
  } else {
    // default: short summary report of enrollment indices
    filename = "academic_registrations.csv";
    csvContent = "Student ID,Name,Enrollment Date,Status\n";
    db.getStudents().forEach(s => {
      csvContent += `"${s.studentId}","${s.firstName} ${s.lastName}","${s.enrollmentDate}","${s.status}"\n`;
    });
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.status(200).send(csvContent);
});


// --- STUDENT REGISTRATION (SIGN UP) & ACCOUNT RESET ENDPOINTS ---

app.post("/api/auth/signup", (req: Request, res: Response): void => {
  const { 
    email, 
    studentId, 
    password
  } = req.body;

  if (!email || !studentId || !password) {
    res.status(400).json({ error: "Email, Student ID, and Password are required to onboard." });
    return;
  }

  if (!isPasswordComplex(password)) {
    res.status(400).json({ error: "Password must be at least 10 characters long, containing at least one uppercase letter, one digit, and one special character." });
    return;
  }

  // Look up pre-registered student record matching Email and Student ID
  const student = db.getState().students.find(
    s => s.email.toLowerCase().trim() === email.toLowerCase().trim() &&
         s.studentId.toUpperCase().trim() === studentId.toUpperCase().trim()
  );

  if (!student) {
    res.status(400).json({ 
      error: `Access Denied: No pre-registered student record found matching Email "${email}" and Student ID "${studentId}". You cannot register unless admitted and registered into the student registry database by the School Admissions Board.` 
    });
    return;
  }

  // Check if they already have an active/verified user record
  let user = db.getState().users.find(u => u.id === student.userId);
  if (user && user.password && user.isVerified) {
    res.status(400).json({ error: "An active portal account is already associated with this student registry. Please log in or reset your password." });
    return;
  }

  try {
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (!user) {
      // Create user record
      const nextUserId = db.getState().nextId.users;
      user = {
        id: nextUserId,
        username: student.studentId.toLowerCase(),
        email: student.email,
        role: 'STUDENT',
        isActive: true,
        createdAt: new Date().toISOString(),
        password: password,
        isVerified: false,
        verificationCode
      };
      db.getState().users.push(user);
      db.getState().nextId.users = nextUserId + 1;
      student.userId = user.id;
    } else {
      // Reuse existing/unverified user
      user.username = student.studentId.toLowerCase();
      user.password = password;
      user.isVerified = false;
      user.verificationCode = verificationCode;
    }

    // Save changes
    (db as any).save();

    db.log(user.id, user.username, user.role, 'AUTH_SIGNUP', `Student self-onboarded using pre-registered credentials. Verification code generated: ${verificationCode}`);

    // Send E-mail verification
    const renderedEmail = getRenderedEmailTemplate('STUDENT_ONBOARDING', {
      firstName: student.firstName,
      lastName: student.lastName,
      verificationCode: verificationCode
    });

    sendEmail({
      to: student.email,
      subject: renderedEmail.subject,
      text: renderedEmail.text,
      html: renderedEmail.html
    }).catch(err => {
      console.error("[MAIL] Error sending student signup email verification:", err);
    });

    res.status(201).json({
      needsVerification: true,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- FACULTY REGISTRATION (SIGN UP) ENDPOINT ---
app.post("/api/auth/signup-staff", (req: Request, res: Response): void => {
  const { 
    email, 
    firstName, 
    lastName, 
    position, 
    department, 
    qualification, 
    phone, 
    address 
  } = req.body;

  if (!email || !firstName || !lastName) {
    res.status(400).json({ error: "Missing required faculty sign-up fields (Email, First Name, Last Name)." });
    return;
  }

  // Generate unique username based on Surname (lastName)
  let generatedUsername = lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!generatedUsername) {
    generatedUsername = "staff";
  }
  let isTaken = db.getState().users.some(u => u.username.toLowerCase() === generatedUsername);
  let counter = 1;
  while (isTaken) {
    generatedUsername = `${lastName.trim().toLowerCase().replace(/[^a-z0-9]/g, "")}${counter}`;
    isTaken = db.getState().users.some(u => u.username.toLowerCase() === generatedUsername);
    counter++;
  }

  // Generate secure password that passes isPasswordComplex
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
  const p1 = upper[Math.floor(Math.random() * upper.length)];
  const p2 = digits[Math.floor(Math.random() * digits.length)];
  const p3 = special[Math.floor(Math.random() * special.length)];
  const all = upper + lower + digits + special;
  let remaining = "";
  for (let i = 0; i < 9; i++) {
    remaining += all[Math.floor(Math.random() * all.length)];
  }
  const generatedPassword = `${p1}${p2}${p3}${remaining}`;

  // Check if email already exists
  const existingUser = db.getState().users.find(
    u => u.email.toLowerCase() === email.toLowerCase().trim()
  );
  if (existingUser) {
    res.status(400).json({ error: "Email is already registered." });
    return;
  }

  try {
    // 1. Create user record
    const nextUserId = db.getState().nextId.users;
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const user: any = {
      id: nextUserId,
      username: generatedUsername,
      email: email.trim(),
      role: 'STAFF',
      isActive: true,
      createdAt: new Date().toISOString(),
      password: generatedPassword,
      isVerified: false,
      verificationCode
    };
    db.getState().users.push(user);
    db.getState().nextId.users = nextUserId + 1;

    // 2. Create staff record
    const nextStaffId = db.getState().nextId.staff;
    const staffIdStr = `STF${String(nextStaffId).padStart(3, '0')}`;
    const staff: any = {
      id: nextStaffId,
      userId: user.id,
      staffId: staffIdStr,
      firstName,
      lastName,
      position: position || 'Lecturer',
      department: department || 'General Education',
      qualification: qualification || 'M.Sc.',
      joiningDate: new Date().toISOString().split('T')[0],
      phone: phone || '',
      email: email.trim(),
      address: address || '',
      status: 'PENDING_APPROVAL',
      profilePic: `https://images.unsplash.com/photo-${1510000000000 + Math.floor(Math.random() * 500000)}?w=150`
    };
    db.getState().staff.push(staff);
    db.getState().nextId.staff = nextStaffId + 1;

    // 3. Set salary structure
    const nextSalId = db.getState().nextId.salaryStructures;
    const salStr: any = {
      id: nextSalId,
      staffId: staff.id,
      basicSalary: 6000,
      allowances: 0,
      deductions: 0,
      effectiveFrom: staff.joiningDate
    };
    db.getState().salaryStructures.push(salStr);
    db.getState().nextId.salaryStructures = nextSalId + 1;

    // Save changes
    (db as any).save();

    db.log(user.id, user.username, user.role, 'AUTH_SIGNUP_STAFF', `Lecturer self-onboarded. Username (Surname) generated: ${generatedUsername}. Verification code generated: ${verificationCode}`);

    // Send E-mail verification
    const renderedEmail = getRenderedEmailTemplate('STAFF_ONBOARDING', {
      firstName,
      lastName,
      generatedUsername,
      generatedPassword,
      verificationCode
    });

    sendEmail({
      to: email,
      subject: renderedEmail.subject,
      text: renderedEmail.text,
      html: renderedEmail.html
    }).catch(err => {
      console.error("[MAIL] Error sending staff signup email verification:", err);
    });

    res.status(201).json({
      needsVerification: true,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// App Verification Endpoint
app.post("/api/auth/verify", (req: Request, res: Response): void => {
  const { username, code } = req.body;
  if (!username || !code) {
    res.status(400).json({ error: "Username and verification code are required" });
    return;
  }

  const user = db.getState().users.find(
    u => u.username.toLowerCase() === username.trim().toLowerCase()
  );

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (user.verificationCode !== code) {
    res.status(400).json({ error: "Invalid verification code. Please check your email or console logs." });
    return;
  }

  user.isVerified = true;
  (db as any).save();

  db.log(user.id, user.username, user.role, 'AUTH_VERIFY_EMAIL', `User successfully verified their email address.`);

  // Find profile
  let profile: any = null;
  if (user.role === 'STUDENT') {
    profile = db.getState().students.find(s => s.userId === user.id);
  } else if (user.role === 'STAFF') {
    profile = db.getState().staff.find(s => s.userId === user.id);
  }

  // Generate verified token
  const token = generateSecureToken(user.role, user.id);

  res.json({
    message: "Email verified successfully",
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    profile
  });
});

// Resend Verification Code Endpoint
app.post("/api/auth/resend-code", (req: Request, res: Response): void => {
  const { username } = req.body;
  if (!username) {
    res.status(400).json({ error: "Username is required" });
    return;
  }

  const user = db.getState().users.find(
    u => u.username.toLowerCase() === username.toLowerCase()
  );

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.verificationCode = newCode;
  (db as any).save();

  db.log(user.id, user.username, user.role, 'AUTH_RESEND_CODE', `Verification code resent.`);

  // Send the email
  sendEmail({
    to: user.email,
    subject: "Resend: Verify Your University Hub Account",
    text: `Your new 6-digit verification code is: ${newCode}\n\nPlease enter this code in the app to activate your account.`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
        <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-top: 0;">New Verification Code</h2>
        <p>Hello <strong>${user.username}</strong>,</p>
        <p>A request was received to resend your email verification code. Please use the passcode below to activate your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 5px; color: #1e3a8a; background: #eff6ff; padding: 12px 30px; border-radius: 8px; border: 1px solid #bfdbfe; display: inline-block;">
            ${newCode}
          </span>
        </div>
        <p style="font-size: 13px; color: #64748b;">If you need anything else, please contact the administrators.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; text-align: center; color: #94a3b8; margin-bottom: 0;">University Hub Support Team</p>
      </div>
    `
  }).catch(err => console.error("Error resending signup code:", err));

  res.json({
    message: "A new activation code has been issued to your email"
  });
});

// Forgot Password REQUEST endpoint (triggers code sending)
app.post("/api/auth/forgot-password-request", (req: Request, res: Response): void => {
  const { username, email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Registered email address is required" });
    return;
  }

  let user;
  if (username && username.trim() !== '') {
    user = db.getState().users.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() && u.email.toLowerCase() === email.trim().toLowerCase()
    );
  } else {
    // Lookup exclusively by email if they forgot their username
    user = db.getState().users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase()
    );
  }

  if (!user) {
    res.status(404).json({ error: "No matching registered profile found with those details." });
    return;
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetCode = resetCode;
  (db as any).save();

  db.log(user.id, user.username, user.role, 'AUTH_FORGOT_PASSWORD_REQ', `Password reset requested. Code sent to ${email}`);

  // Send the email with their username clearly displayed
  const renderedEmail = getRenderedEmailTemplate('PASSWORD_RESET', {
    username: user.username,
    resetCode: resetCode
  });

  // Customize subject and content to include username for recovery
  const finalSubject = `Credential Recovery: ${renderedEmail.subject}`;
  const finalHtml = renderedEmail.html.replace(
    `<p>Hello <strong>${user.username}</strong>,</p>`,
    `<p>Hello <strong>${user.username}</strong>,</p>
     <div style="background: #f1f5f9; padding: 10px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #651fff;">
       <strong>Username Recovery:</strong> Your account username is <strong style="color: #651fff; font-family: monospace;">${user.username}</strong>
     </div>`
  );

  sendEmail({
    to: email,
    subject: finalSubject,
    text: `Hello ${user.username},\n\nYour account username is: ${user.username}\n\nYour security reset authorization code is: ${resetCode}\n\nPlease enter this on the portal to reset your password.`,
    html: finalHtml
  }).catch(err => console.error("Error sending forgot password email:", err));

  res.json({
    message: "An authorization code was dispatched to your email address.",
    username: user.username // Return the recovered username so the UI can prefill it!
  });
});

app.post("/api/auth/forgot-password", (req: Request, res: Response): void => {
  const { username, email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    res.status(400).json({ error: "Missing required fields (email, verification code, new password)" });
    return;
  }

  if (!isPasswordComplex(newPassword)) {
    res.status(400).json({ error: "New password must be at least 10 characters long, containing at least one uppercase letter, one digit, and one special character." });
    return;
  }

  // Lookup primarily by email, supporting cases where username wasn't known originally
  const user = db.getState().users.find(
    u => u.email.toLowerCase() === email.trim().toLowerCase()
  );

  if (!user) {
    res.status(404).json({ error: "No matching registered profile match found." });
    return;
  }

  if (user.resetCode !== code) {
    res.status(400).json({ error: "Invalid security code. Please check your email or console logs." });
    return;
  }

  // Update password field
  user.password = newPassword;
  user.resetCode = undefined;
  (db as any).save();

  db.log(user.id, user.username, user.role, 'AUTH_PASSWORD_RESET', `User successfully updated account passwords.`);

  res.json({ 
    message: "Password updated successfully! You can now log in.",
    username: user.username
  });
});


// --- COURSE NOTES / LECTURE MATERIALS ENDPOINTS ---

app.get("/api/student/notes", authenticateToken, authorizeRole(['STUDENT']), (req: AuthenticatedRequest, res: Response): void => {
  const studentId = req.user!.studentId;
  if (!studentId) {
    res.json([]);
    return;
  }
  // Find course class assignments matching enrollments
  const enrolls = db.getState().studentEnrollments.filter(e => e.studentId === studentId && e.status === 'ACTIVE');
  const classIds = enrolls.map(e => e.classId);
  const subjectsInClass = db.getState().subjects.filter(s => s.classId !== null && classIds.includes(s.classId!));
  const subjIds = subjectsInClass.map(s => s.id);

  // Filter notes that align with these enrolled subjects
  const notes = (db.getState().courseNotes || []).filter(note => subjIds.includes(note.subjectId));
  const detailedNotes = notes.map(n => {
    const subj = db.getState().subjects.find(s => s.id === n.subjectId);
    return {
      ...n,
      subjectName: subj ? subj.subjectName : 'General Unit'
    };
  });
  res.json(detailedNotes);
});

app.get("/api/staff/notes", authenticateToken, authorizeRole(['STAFF']), (req: AuthenticatedRequest, res: Response): void => {
  const staffId = req.user!.staffId;
  if (!staffId) {
    res.json([]);
    return;
  }
  const myAllocatedSubjectIds = db.getState().staffSubjects
    .filter(ss => ss.staffId === staffId)
    .map(ss => ss.subjectId);

  const notes = (db.getState().courseNotes || []).filter(note => myAllocatedSubjectIds.includes(note.subjectId));
  const detailedNotes = notes.map(n => {
    const subj = db.getState().subjects.find(s => s.id === n.subjectId);
    return {
      ...n,
      subjectName: subj ? subj.subjectName : 'General Unit'
    };
  });
  res.json(detailedNotes);
});

app.post("/api/staff/notes", authenticateToken, authorizeRole(['STAFF']), (req: AuthenticatedRequest, res: Response): void => {
  const staffId = req.user!.staffId;
  const { subjectId, title, description, fileUrl } = req.body;

  if (!staffId) {
    res.status(403).json({ error: "Only allocated staff members can create lectures files" });
    return;
  }

  if (!subjectId || !title) {
    res.status(400).json({ error: "Subject ID and note title details are required" });
    return;
  }

  try {
    const nextId = db.getState().nextId.courseNotes || 1;
    const staffProfile = db.getState().staff.find(s => s.id === staffId);
    const uploadedBy = staffProfile ? `${staffProfile.firstName} ${staffProfile.lastName}` : req.user!.username;

    const newNote = {
      id: nextId,
      subjectId: parseInt(String(subjectId), 10),
      title,
      description: description || '',
      fileUrl: fileUrl || 'http://example.com/lecture_materials_notes.pdf',
      uploadedBy,
      createdAt: new Date().toISOString()
    };

    if (!db.getState().courseNotes) {
      db.getState().courseNotes = [];
    }
    db.getState().courseNotes.push(newNote);
    db.getState().nextId.courseNotes = nextId + 1;
    (db as any).save();

    db.log(req.user!.id, req.user!.username, req.user!.role, 'UPLOAD_NOTES', `Notes posted: "${title}"`);
    res.status(201).json(newNote);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// --- QUIZZES AND ASSIGNMENTS ACADEMICS ENDPOINTS ---

app.get("/api/student/assessments", authenticateToken, authorizeRole(['STUDENT']), (req: AuthenticatedRequest, res: Response): void => {
  const studentId = req.user!.studentId;
  if (!studentId) {
    res.json([]);
    return;
  }

  const enrolls = db.getState().studentEnrollments.filter(e => e.studentId === studentId && e.status === 'ACTIVE');
  const classIds = enrolls.map(e => e.classId);
  const subjectsInClass = db.getState().subjects.filter(s => s.classId !== null && classIds.includes(s.classId!));
  const subjIds = subjectsInClass.map(s => s.id);

  const assessments = (db.getState().quizzesAndAssignments || []).filter(a => subjIds.includes(a.subjectId));
  const submissions = (db.getState().studentSubmissions || []).filter(s => s.studentId === studentId);

  const enriched = assessments.map(a => {
    const sub = db.getState().subjects.find(s => s.id === a.subjectId);
    const subRecord = submissions.find(s => s.assessmentId === a.id);
    return {
      ...a,
      subjectName: sub ? sub.subjectName : 'General Unit',
      submissionStatus: subRecord ? subRecord.status : 'PENDING',
      marksObtained: subRecord ? subRecord.score : null,
      feedback: subRecord ? subRecord.feedback : null,
      submittedAt: subRecord ? subRecord.submittedAt : null,
      submittedAnswers: subRecord ? subRecord.submittedAnswers : null,
      submittedText: subRecord ? subRecord.submittedText : null
    };
  });

  res.json(enriched);
});

app.get("/api/staff/assessments", authenticateToken, authorizeRole(['STAFF']), (req: AuthenticatedRequest, res: Response): void => {
  const staffId = req.user!.staffId;
  if (!staffId) {
    res.json([]);
    return;
  }
  const myAllocatedSubjectIds = db.getState().staffSubjects
    .filter(ss => ss.staffId === staffId)
    .map(ss => ss.subjectId);

  const assessments = (db.getState().quizzesAndAssignments || []).filter(a => myAllocatedSubjectIds.includes(a.subjectId));
  const detailed = assessments.map(a => {
    const subj = db.getState().subjects.find(s => s.id === a.subjectId);
    return {
      ...a,
      subjectName: subj ? subj.subjectName : 'General Unit'
    };
  });
  res.json(detailed);
});

app.post("/api/staff/assessments", authenticateToken, authorizeRole(['STAFF']), (req: AuthenticatedRequest, res: Response): void => {
  const staffId = req.user!.staffId;
  const { subjectId, type, title, description, maxPoints, durationMinutes, deadline, questions } = req.body;

  if (!staffId) {
    res.status(403).json({ error: "Faculty credentials required to create tests" });
    return;
  }

  if (!subjectId || !type || !title || !maxPoints) {
    res.status(400).json({ error: "Missing key assessment details (subjectId, type, title, maxPoints)" });
    return;
  }

  try {
    const nextId = db.getState().nextId.quizzesAndAssignments || 1;
    const newAssessment = {
      id: nextId,
      subjectId: parseInt(String(subjectId), 10),
      type: type === 'QUIZ' ? 'QUIZ' : 'ASSIGNMENT',
      title,
      description: description || '',
      maxPoints: parseFloat(String(maxPoints)) || 100,
      durationMinutes: durationMinutes ? parseInt(String(durationMinutes), 10) : 0,
      deadline: deadline || new Date(Date.now() + 7 * 86400000).toISOString(),
      questions: questions || []
    };

    if (!db.getState().quizzesAndAssignments) {
      db.getState().quizzesAndAssignments = [];
    }
    db.getState().quizzesAndAssignments.push(newAssessment as any);
    db.getState().nextId.quizzesAndAssignments = nextId + 1;
    (db as any).save();

    db.log(req.user!.id, req.user!.username, req.user!.role, 'CREATE_ASSESSMENT', `Posted new ${type}: "${title}"`);
    res.status(201).json(newAssessment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// --- SUBMISSION ACTIONS ---

app.post("/api/student/submit-assessment", authenticateToken, authorizeRole(['STUDENT']), (req: AuthenticatedRequest, res: Response): void => {
  const studentId = req.user!.studentId;
  const { assessmentId, submittedAnswers, submittedText } = req.body;

  if (!studentId) {
    res.status(403).json({ error: "Student profile is required to pass evaluations" });
    return;
  }

  if (!assessmentId) {
    res.status(400).json({ error: "Assessment ID is required" });
    return;
  }

  try {
    const specAssessment = (db.getState().quizzesAndAssignments || []).find(a => a.id === parseInt(String(assessmentId), 10));
    if (!specAssessment) {
      res.status(404).json({ error: "Target evaluation item does not exist" });
      return;
    }

    // Check if progress is already logged
    const existing = (db.getState().studentSubmissions || []).find(
      s => s.assessmentId === specAssessment.id && s.studentId === studentId
    );
    if (existing) {
      res.status(400).json({ error: "You have already uploaded solutions for this assessment modules." });
      return;
    }

    // Auto-grade quizzes if answers conform
    let calculatedScore: number | undefined;
    let finalStatus: 'SUBMITTED' | 'GRADED' = 'SUBMITTED';

    if (specAssessment.type === 'QUIZ' && specAssessment.questions && Array.isArray(submittedAnswers)) {
      let correctCount = 0;
      specAssessment.questions.forEach((q, idx) => {
        const studentChoice = submittedAnswers[idx];
        if (studentChoice !== undefined && studentChoice === q.correctAnswerIndex) {
          correctCount++;
        }
      });
      // Fractional points mapping
      const pointsPerQuestion = specAssessment.maxPoints / specAssessment.questions.length;
      calculatedScore = Math.round(correctCount * pointsPerQuestion * 10) / 10;
      finalStatus = 'GRADED'; // Quizzes auto-grade!
    }

    const nextId = db.getState().nextId.studentSubmissions || 1;
    const newSubmission = {
      id: nextId,
      assessmentId: specAssessment.id,
      studentId: studentId,
      submittedAnswers: submittedAnswers || null,
      submittedText: submittedText || '',
      score: calculatedScore,
      feedback: finalStatus === 'GRADED' ? 'Interactive Quiz graded automatically.' : null,
      submittedAt: new Date().toISOString(),
      status: finalStatus
    };

    if (!db.getState().studentSubmissions) {
      db.getState().studentSubmissions = [];
    }
    db.getState().studentSubmissions.push(newSubmission as any);
    db.getState().nextId.studentSubmissions = nextId + 1;
    (db as any).save();

    db.log(req.user!.id, req.user!.username, req.user!.role, 'SUBMIT_ASSESSMENT', `Student submitted ${specAssessment.type} ID ${assessmentId}`);
    res.status(201).json(newSubmission);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/student/submissions", authenticateToken, authorizeRole(['STUDENT']), (req: AuthenticatedRequest, res: Response): void => {
  const studentId = req.user!.studentId;
  const submissions = (db.getState().studentSubmissions || []).filter(s => s.studentId === studentId);
  const detailed = submissions.map(s => {
    const asm = (db.getState().quizzesAndAssignments || []).find(a => a.id === s.assessmentId);
    return {
      ...s,
      assessmentDetails: asm || null
    };
  });
  res.json(detailed);
});

app.get("/api/staff/submissions", authenticateToken, authorizeRole(['STAFF']), (req: AuthenticatedRequest, res: Response): void => {
  const staffId = req.user!.staffId;
  if (!staffId) {
    res.json([]);
    return;
  }

  // Get active subjects
  const myAllocatedSubjectIds = db.getState().staffSubjects
    .filter(ss => ss.staffId === staffId)
    .map(ss => ss.subjectId);

  // Filter evaluations within these subjects
  const assessments = (db.getState().quizzesAndAssignments || []).filter(a => myAllocatedSubjectIds.includes(a.subjectId));
  const assessmentIds = assessments.map(a => a.id);

  // Get submissions matching these ID indexes
  const submissions = (db.getState().studentSubmissions || []).filter(sub => assessmentIds.includes(sub.assessmentId));

  const detailed = submissions.map(sub => {
    const parentAsm = assessments.find(a => a.id === sub.assessmentId);
    const studentProf = db.getState().students.find(st => st.id === sub.studentId);
    return {
      ...sub,
      assessmentDetails: parentAsm || null,
      studentDetails: studentProf ? {
        id: studentProf.id,
        studentId: studentProf.studentId,
        firstName: studentProf.firstName,
        lastName: studentProf.lastName,
        email: studentProf.email
      } : null
    };
  });

  res.json(detailed);
});

app.put("/api/staff/submissions/:id/grade", authenticateToken, authorizeRole(['STAFF', 'ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const submissionId = parseInt(req.params.id, 10);
  const { score, feedback } = req.body;

  const submissions = db.getState().studentSubmissions || [];
  const submission = submissions.find(s => s.id === submissionId);

  if (!submission) {
    res.status(404).json({ error: "Target student submission record not found" });
    return;
  }

  try {
    submission.score = parseFloat(String(score));
    if (feedback !== undefined) {
      submission.feedback = feedback;
    }
    submission.status = 'GRADED';
    (db as any).save();

    // Log a grade item into student grade records for uniform visibility in reports
    const assessmentDetails = (db.getState().quizzesAndAssignments || []).find(a => a.id === submission.assessmentId);
    if (assessmentDetails) {
      const nextGradeId = db.getState().nextId.grades;
      const parsedGrading: any = {
        id: nextGradeId,
        studentId: submission.studentId,
        subjectId: assessmentDetails.subjectId,
        marksObtained: submission.score,
        totalMarks: assessmentDetails.maxPoints,
        grade: submission.score / assessmentDetails.maxPoints >= 0.9 ? 'A+' :
               submission.score / assessmentDetails.maxPoints >= 0.8 ? 'A' :
               submission.score / assessmentDetails.maxPoints >= 0.7 ? 'B' :
               submission.score / assessmentDetails.maxPoints >= 0.6 ? 'C' :
               submission.score / assessmentDetails.maxPoints >= 0.5 ? 'D' : 'F',
        examType: assessmentDetails.type,
        academicYear: '2024'
      };
      db.getState().grades.push(parsedGrading);
      db.getState().nextId.grades = nextGradeId + 1;
      (db as any).save();
    }

    db.log(req.user!.id, req.user!.username, req.user!.role, 'GRADE_SUBMISSION', `Graded student submission ID ${submissionId} with score ${score}`);
    res.json(submission);
  } catch (err: any) {
    res.status(550).json({ error: err.message });
  }
});


// --- ATTENDANCE ROSTERS COHORT ENDPOINT ---

app.get("/api/staff/class-students/:subjectId", authenticateToken, authorizeRole(['STAFF', 'ADMIN']), (req: AuthenticatedRequest, res: Response): void => {
  const subjectId = parseInt(req.params.subjectId, 10);
  const subject = db.getState().subjects.find(s => s.id === subjectId);

  if (!subject || !subject.classId) {
    res.json([]);
    return;
  }

  // Find students matching this subject enrollment class
  const classEnrollments = db.getState().studentEnrollments.filter(e => e.classId === subject.classId && e.status === 'ACTIVE');
  const studentIds = classEnrollments.map(e => e.studentId);

  const roster = db.getState().students.filter(st => studentIds.includes(st.id));
  res.json(roster);
});


// Serve static space and hook up Vite Engine for multi-module client bundles
async function startServer() {
  // Vite dev server mounting in non-production environments
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Vite Server Ready] Express listening on http://localhost:${PORT}`);
  });
}

startServer();
