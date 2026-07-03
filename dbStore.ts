import fs from 'fs';
import path from 'path';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'STUDENT';
  isActive: boolean;
  createdAt: string;
  password?: string;
  isVerified?: boolean;
  verificationCode?: string;
  resetCode?: string;
}

export interface CourseNote {
  id: number;
  subjectId: number;
  title: string;
  description: string;
  fileUrl: string;
  uploadedBy: string; // Staff full name
  createdAt: string;
}

export interface QuizQuestion {
  id: number;
  text: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Assessment {
  id: number;
  subjectId: number;
  type: 'QUIZ' | 'ASSIGNMENT';
  title: string;
  description: string;
  maxPoints: number;
  durationMinutes: number; // For quiz timeouts
  deadline: string;
  questions?: QuizQuestion[]; // For quizzes
}

export interface StudentSubmission {
  id: number;
  assessmentId: number;
  studentId: number;
  submittedAnswers?: number[]; // indices chosen for quiz questions
  submittedText?: string; // rich text or link for assignment
  score?: number; // Teacher graded marks
  feedback?: string; // Teacher feedback
  submittedAt: string;
  status: 'SUBMITTED' | 'GRADED';
}

export interface Student {
  id: number;
  userId: number;
  studentId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  address: string;
  enrollmentDate: string;
  status: 'ACTIVE' | 'GRADUATED' | 'SUSPENDED' | 'WITHDRAWN' | 'PENDING_APPROVAL';
  adminApproved?: boolean;
  lecturerApproved?: boolean;
  profilePic?: string;
  email: string; // convenient lookup
}

export interface Staff {
  id: number;
  userId: number;
  staffId: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  qualification: string;
  joiningDate: string;
  phone: string;
  email: string;
  address: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'PENDING_APPROVAL';
  profilePic?: string;
}

export interface Class {
  id: number;
  className: string;
  section: string;
  academicYear: string;
  capacity: number;
  description: string;
}

export interface Subject {
  id: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  description: string;
  classId: number | null;
}

export interface StaffSubject {
  id: number;
  staffId: number;
  subjectId: number;
  academicYear: string;
}

export interface StudentEnrollment {
  id: number;
  studentId: number;
  classId: number;
  enrollmentDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED';
}

export interface FeeStructure {
  id: number;
  classId: number;
  academicYear: string;
  totalFees: number;
  admissionFee: number;
  tuitionFee: number;
  libraryFee: number;
  sportsFee: number;
  dueDate: string;
  lateFeePenalty: number;
}

export interface FeePayment {
  id: number;
  studentId: number;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'MPESA' | 'AIRTEL_MONEY';
  transactionId: string;
  receiptNo: string;
  remarks: string;
  academicYear: string;
}

export interface SalaryStructure {
  id: number;
  staffId: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  effectiveFrom: string;
}

export interface SalaryPayment {
  id: number;
  staffId: number;
  amount: number;
  paymentDate: string;
  month: number; // 1-12
  year: number;
  paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'CHEQUE';
  transactionId: string;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
}

export interface Classroom {
  id: number;
  roomNumber: string;
  building: string;
  capacity: number;
  hasProjector: boolean;
  hasAc: boolean;
}

export interface ClassroomAssignment {
  id: number;
  classroomId: number;
  classId: number;
  subjectId: number;
  staffId: number;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  academicYear: string;
}

export interface Grade {
  id: number;
  studentId: number;
  subjectId: number;
  marksObtained: number;
  totalMarks: number;
  grade: string;
  examType: 'MID_TERM' | 'FINAL_TERM' | 'QUIZ' | 'ASSIGNMENT';
  academicYear: string;
}

export interface Attendance {
  id: number;
  studentId: number;
  subjectId: number;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
}

export interface SystemLog {
  id: number;
  userId: number;
  username: string;
  role: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface EmailTemplate {
  id: string; // e.g. 'STUDENT_ONBOARDING', 'STAFF_ONBOARDING', 'PASSWORD_RESET'
  name: string;
  subject: string;
  text: string;
  html: string;
}

export interface Session {
  token: string;
  userId: number;
  lastActive: string; // ISO string
  rememberMe: boolean;
  createdAt: string; // ISO string
}

export interface DbState {
  users: User[];
  students: Student[];
  staff: Staff[];
  classes: Class[];
  subjects: Subject[];
  staffSubjects: StaffSubject[];
  studentEnrollments: StudentEnrollment[];
  feeStructures: FeeStructure[];
  feePayments: FeePayment[];
  salaryStructures: SalaryStructure[];
  salaryPayments: SalaryPayment[];
  classrooms: Classroom[];
  classroomAssignments: ClassroomAssignment[];
  grades: Grade[];
  attendance: Attendance[];
  logs: SystemLog[];
  courseNotes: CourseNote[];
  quizzesAndAssignments: Assessment[];
  studentSubmissions: StudentSubmission[];
  emailTemplates: EmailTemplate[];
  sessions: Session[];
  nextId: { [table: string]: number };
}

const DATA_FILE = path.join(process.cwd(), 'university_data.json');

// Preloaded data matching SQL commands exactly & providing fully working environment
const buildInitialState = (): DbState => {
  return {
    users: [
      { id: 1, username: 'admin', email: 'mosesmwamuye97@gmail.com', role: 'ADMIN', isActive: true, createdAt: '2026-01-01T00:00:00.000Z', password: 'admin' },
      { id: 2, username: 'john.staff', email: 'john@university.com', role: 'STAFF', isActive: true, createdAt: '2026-01-01T00:00:00.000Z', password: 'password' },
      { id: 3, username: 'jane.student', email: 'jane@university.com', role: 'STUDENT', isActive: true, createdAt: '2026-01-01T00:00:00.000Z', password: 'password' },
      { id: 4, username: 'robert.staff', email: 'robert@university.com', role: 'STAFF', isActive: true, createdAt: '2026-01-01T00:00:00.000Z', password: 'password' },
      { id: 5, username: 'isaac.staff', email: 'isaac@university.com', role: 'STAFF', isActive: true, createdAt: '2026-01-01T00:00:00.000Z', password: 'password' },
      { id: 6, username: 'richard.staff', email: 'richard@university.com', role: 'STAFF', isActive: true, createdAt: '2026-01-01T00:00:00.000Z', password: 'password' },
    ],
    students: [
      {
        id: 1,
        userId: 3,
        studentId: 'STU001',
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '2004-05-14',
        gender: 'FEMALE',
        phone: '0987654321',
        address: '456 University Ave, Block B',
        enrollmentDate: '2023-09-01',
        status: 'ACTIVE',
        email: 'jane@university.com',
        profilePic: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      },
    ],
    staff: [
      {
        id: 1,
        userId: 2,
        staffId: 'STF001',
        firstName: 'John',
        lastName: 'Doe',
        position: 'Senior Teacher',
        department: 'Computer Science',
        qualification: 'M.Sc. in Computer Science',
        joiningDate: '2020-01-15',
        phone: '1234567890',
        email: 'john@university.com',
        address: '123 Faculty Lane, West Campus',
        status: 'ACTIVE',
        profilePic: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      },
      {
        id: 2,
        userId: 4,
        staffId: 'STF002',
        firstName: 'Robert',
        lastName: 'Boyle',
        position: 'Lecturer',
        department: 'Mechanical Engineering',
        qualification: 'Ph.D. in Thermodynamics',
        joiningDate: '2021-08-10',
        phone: '555-0102',
        email: 'robert@university.com',
        address: '254 Engineering Annex',
        status: 'ACTIVE',
        profilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      },
      {
        id: 3,
        userId: 5,
        staffId: 'STF003',
        firstName: 'Isaac',
        lastName: 'Newton',
        position: 'Professor',
        department: 'Mechanical Engineering',
        qualification: 'Ph.D. in Classical Mechanics',
        joiningDate: '2019-02-12',
        phone: '555-0103',
        email: 'isaac@university.com',
        address: '101 Newton Core Tower',
        status: 'ACTIVE',
        profilePic: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      },
      {
        id: 4,
        userId: 6,
        staffId: 'STF004',
        firstName: 'Richard',
        lastName: 'Feynman',
        position: 'Associate Professor',
        department: 'Mechanical Engineering',
        qualification: 'Ph.D. in Quantum Electrodynamics',
        joiningDate: '2022-01-10',
        phone: '555-0104',
        email: 'richard@university.com',
        address: '305 Quantum Labs Hall',
        status: 'ACTIVE',
        profilePic: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
      },
    ],
    classes: [
      { id: 1, className: 'Computer Science', section: 'A', academicYear: '2024', capacity: 30, description: 'Core Computer Science curriculum' },
      { id: 2, className: 'Software Engineering', section: 'B', academicYear: '2024', capacity: 25, description: 'Advanced Software Architectures' },
      { id: 3, className: 'Mechanical Engineering', section: 'M', academicYear: '2024', capacity: 40, description: 'Core Thermodynamic and Fluid Engineering' },
    ],
    subjects: [
      { id: 1, subjectCode: 'CS101', subjectName: 'Programming Fundamentals', credits: 3, description: 'Introduction to structural programming & logic', classId: 1 },
      { id: 2, subjectCode: 'CS102', subjectName: 'Data Structures', credits: 3, description: 'Linked Lists, Trees, Graphs & Sorting Algortihms', classId: 1 },
      { id: 3, subjectCode: 'SE201', subjectName: 'Software Architecture', credits: 4, description: 'Design Patterns and Distributed Systems', classId: 2 },
      { id: 4, subjectCode: 'ME301', subjectName: 'Thermodynamics', credits: 4, description: 'Concepts of heat energy, work cycles, and entropy mechanisms', classId: 3 },
      { id: 5, subjectCode: 'ME302', subjectName: 'Fluid Mechanics', credits: 4, description: 'Hydrostatic forces, Bernoulli equation, and streamflow analysis', classId: 3 },
      { id: 6, subjectCode: 'ME303', subjectName: 'Theory of Machines', credits: 3, description: 'Gears, link assemblies, and vibration kinematics', classId: 3 },
      { id: 7, subjectCode: 'ME304', subjectName: 'Strength of Materials', credits: 3, description: 'Elastic stress, strain profiles, and heavy load structures', classId: 3 },
    ],
    staffSubjects: [
      { id: 1, staffId: 1, subjectId: 1, academicYear: '2024' },
      { id: 2, staffId: 1, subjectId: 2, academicYear: '2024' },
      { id: 3, staffId: 1, subjectId: 4, academicYear: '2024' }, // Thermodynamics to John Doe
      { id: 4, staffId: 2, subjectId: 5, academicYear: '2024' }, // Fluid Mechanics to Robert Boyle
      { id: 5, staffId: 3, subjectId: 6, academicYear: '2024' }, // Theory of Machines to Isaac Newton
      { id: 6, staffId: 4, subjectId: 7, academicYear: '2024' }, // Strength of Materials to Richard Feynman
    ],
    studentEnrollments: [
      { id: 1, studentId: 1, classId: 1, enrollmentDate: '2023-09-01', status: 'ACTIVE' },
    ],
    feeStructures: [
      {
        id: 1,
        classId: 1,
        academicYear: '2024',
        totalFees: 12000.00,
        admissionFee: 1500.00,
        tuitionFee: 9000.00,
        libraryFee: 1000.00,
        sportsFee: 500.00,
        dueDate: '2024-10-31',
        lateFeePenalty: 150.00,
      },
      {
        id: 2,
        classId: 2,
        academicYear: '2024',
        totalFees: 14000.00,
        admissionFee: 2000.00,
        tuitionFee: 10000.00,
        libraryFee: 1200.00,
        sportsFee: 800.00,
        dueDate: '2024-11-15',
        lateFeePenalty: 200.00,
      }
    ],
    feePayments: [
      {
        id: 1,
        studentId: 1,
        amountPaid: 8000.00,
        paymentDate: '2024-03-10',
        paymentMethod: 'BANK_TRANSFER',
        transactionId: 'TXN89123789',
        receiptNo: 'REC-2024-001',
        remarks: 'Paid 1st semester fees',
        academicYear: '2024'
      }
    ],
    salaryStructures: [
      {
        id: 1,
        staffId: 1,
        basicSalary: 6500.00,
        allowances: 1200.00,
        deductions: 450.00,
        effectiveFrom: '2020-01-15'
      }
    ],
    salaryPayments: [
      {
        id: 1,
        staffId: 1,
        amount: 7250.00,
        paymentDate: '2024-05-28',
        month: 5,
        year: 2024,
        paymentMethod: 'BANK_TRANSFER',
        transactionId: 'SAL890123',
        status: 'PAID'
      }
    ],
    classrooms: [
      { id: 1, roomNumber: 'RM301', building: 'Engineering Block', capacity: 60, hasProjector: true, hasAc: true },
      { id: 2, roomNumber: 'RM102', building: 'Science Center', capacity: 45, hasProjector: true, hasAc: false },
      { id: 3, roomNumber: 'RM405', building: 'Humanities Tower', capacity: 35, hasProjector: false, hasAc: false },
    ],
    classroomAssignments: [
      {
        id: 1,
        classroomId: 1,
        classId: 1,
        subjectId: 1,
        staffId: 1,
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '11:00',
        academicYear: '2024'
      },
      {
        id: 2,
        classroomId: 1,
        classId: 1,
        subjectId: 2,
        staffId: 1,
        dayOfWeek: 'WEDNESDAY',
        startTime: '13:00',
        endTime: '15:00',
        academicYear: '2024'
      },
      {
        id: 3,
        classroomId: 1,
        classId: 3,
        subjectId: 4,
        staffId: 1,
        dayOfWeek: 'MONDAY',
        startTime: '11:00',
        endTime: '13:00',
        academicYear: '2024'
      },
      {
        id: 4,
        classroomId: 1,
        classId: 3,
        subjectId: 5,
        staffId: 2,
        dayOfWeek: 'TUESDAY',
        startTime: '09:00',
        endTime: '11:00',
        academicYear: '2024'
      },
      {
        id: 5,
        classroomId: 1,
        classId: 3,
        subjectId: 6,
        staffId: 3,
        dayOfWeek: 'THURSDAY',
        startTime: '14:00',
        endTime: '16:00',
        academicYear: '2024'
      },
      {
        id: 6,
        classroomId: 1,
        classId: 3,
        subjectId: 7,
        staffId: 4,
        dayOfWeek: 'FRIDAY',
        startTime: '10:00',
        endTime: '12:05',
        academicYear: '2024'
      }
    ],
    grades: [
      {
        id: 1,
        studentId: 1,
        subjectId: 1,
        marksObtained: 88,
        totalMarks: 100,
        grade: 'A',
        examType: 'MID_TERM',
        academicYear: '2024'
      },
      {
        id: 2,
        studentId: 1,
        subjectId: 1,
        marksObtained: 92,
        totalMarks: 100,
        grade: 'A+',
        examType: 'FINAL_TERM',
        academicYear: '2024'
      }
    ],
    attendance: [
      { id: 1, studentId: 1, subjectId: 1, date: '2024-06-11', status: 'PRESENT' },
      { id: 2, studentId: 1, subjectId: 1, date: '2024-06-12', status: 'PRESENT' },
    ],
    logs: [
      { id: 1, userId: 1, username: 'admin', role: 'ADMIN', action: 'SYSTEM_STARTUP', details: 'University Database initialized with Mechanical Engineering program metrics.', timestamp: '2026-06-13T00:00:00.000Z' },
    ],
    courseNotes: [
      {
        id: 1,
        subjectId: 4,
        title: 'Thermodynamics Lecture 1 - Basics & Laws',
        description: 'Covers thermal equilibrium, equation of states, and the Zeroth/First laws of conservation of energy.',
        fileUrl: 'http://example.com/notes/thermo_basic_laws.pdf',
        uploadedBy: 'John Doe',
        createdAt: '2026-06-14T10:00:00.000Z'
      },
      {
        id: 2,
        subjectId: 5,
        title: 'Fluid Dynamics & Bernoulli Applications',
        description: 'Deriving Bernoulli equation and surveying flow rate through venturi tubes.',
        fileUrl: 'http://example.com/notes/fluids_bernoulli.pdf',
        uploadedBy: 'Robert Boyle',
        createdAt: '2026-06-14T15:30:00.000Z'
      }
    ],
    quizzesAndAssignments: [
      {
        id: 1,
        subjectId: 4,
        type: 'QUIZ',
        title: 'Thermodynamics Laws Baseline Quiz',
        description: 'Evaluate your foundations on state changes, heat transfer, and cyclic engines.',
        maxPoints: 10,
        durationMinutes: 10,
        deadline: '2026-12-31T23:59:00.000Z',
        questions: [
          {
            id: 1,
            text: 'Which physical attribute is governed and established by the Zeroth Law of Thermodynamics?',
            options: ['Internal work', 'Entropy balance', 'Thermal gradient', 'Temperature equilibrium'],
            correctAnswerIndex: 3
          },
          {
            id: 2,
            text: 'In an adiabatic gas compression, what is the heat transfer equivalent to?',
            options: ['dQ = 0', 'dQ > 0', 'dQ < 0', 'dQ equals system work'],
            correctAnswerIndex: 0
          },
          {
            id: 3,
            text: 'Which thermodynamic engine cycle operates with the highest theoretical efficiency margin?',
            options: ['Diesel Cycle', 'Otto Cycle', 'Rankine Cycle', 'Carnot Cycle'],
            correctAnswerIndex: 3
          }
        ]
      },
      {
        id: 2,
        subjectId: 5,
        type: 'ASSIGNMENT',
        title: 'Fluid Mechanics - Venturi Meter Equations',
        description: 'Provide step-by-step mathematical proofs deriving fluid velocity and volumetric flow rate indices using manometer readings. Upload your PDF notes or external document link below.',
        maxPoints: 100,
        durationMinutes: 0,
        deadline: '2026-12-31T23:59:00.000Z'
      }
    ],
    studentSubmissions: [],
    emailTemplates: [
      {
        id: "STUDENT_ONBOARDING",
        name: "Student Onboarding Code",
        subject: "Verify Your University Hub Account",
        text: "Hello {{firstName}},\n\nWelcome to University Hub! Your 6-digit verification code is: {{verificationCode}}\n\nPlease enter this code in the app to activate your account.\n\nBest regards,\nUniversity Hub Admissions Board",
        html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">\n  <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-top: 0;">Verify Your Account</h2>\n  <p>Hello <strong>{{firstName}} {{lastName}}</strong>,</p>\n  <p>Welcome to <strong>University Hub</strong>! We are thrilled to have you join our academic portal.</p>\n  <p>To finalize your registration and secure your profile, please verify your email address using the 6-digit activation code below:</p>\n  <div style="text-align: center; margin: 30px 0;">\n    <span style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 5px; color: #1e3a8a; background: #eff6ff; padding: 12px 30px; border-radius: 8px; border: 1px solid #bfdbfe; display: inline-block;">\n      {{verificationCode}}\n    </span>\n  </div>\n  <p style="font-size: 13px; color: #64748b;">If you haven't recently signed up for University Hub, please ignore this message.</p>\n  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />\n  <p style="font-size: 11px; text-align: center; color: #94a3b8; margin-bottom: 0;">University Hub Admissions & Registrar Board</p>\n</div>`
      },
      {
        id: "STAFF_ONBOARDING",
        name: "Staff Portal Onboarding Code",
        subject: "Verify Your University Hub Faculty Account",
        text: "Hello {{firstName}},\n\nWelcome to University Hub Faculty! Your login username (Surname) is: {{generatedUsername}}\nYour temporary password is: {{generatedPassword}}\n\nYour 6-digit verification code is: {{verificationCode}}\n\nPlease enter this code in the app to activate your account.\n\nBest regards,\nUniversity Hub Faculty Board",
        html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">\n  <h2 style="color: #0f766e; border-bottom: 2px solid #0d9488; padding-bottom: 10px; margin-top: 0;">Faculty Hub Verification</h2>\n  <p>Hello <strong>Prof. {{firstName}} {{lastName}}</strong>,</p>\n  <p>Welcome to <strong>University Hub</strong>! We are thrilled to welcome you to our academic instruction team.</p>\n  <p>Your login credentials have been automatically generated as requested:</p>\n  <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; margin: 15px 0;">\n    <p style="margin: 4px 0; font-size: 13px;"><strong>Username (Surname):</strong> <code style="color: #0d9488; font-weight: bold;">{{generatedUsername}}</code></p>\n    <p style="margin: 4px 0; font-size: 13px;"><strong>Temporary Password:</strong> <code style="color: #0d9488; font-weight: bold;">{{generatedPassword}}</code></p>\n  </div>\n  <p>To finalize your registration and secure your profile, please verify your email address using the 6-digit faculty activation code below:</p>\n  <div style="text-align: center; margin: 30px 0;">\n    <span style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 5px; color: #0d9488; background: #f0fdfa; padding: 12px 30px; border-radius: 8px; border: 1px solid #ccfbf1; display: inline-block;">\n      {{verificationCode}}\n    </span>\n  </div>\n  <p style="font-size: 13px; color: #64748b;">If you did not request this verification process, please disregard this email.</p>\n  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />\n  <p style="font-size: 11px; text-align: center; color: #94a3b8; margin-bottom: 0;">University Hub Administrative Registrar</p>\n</div>`
      },
      {
        id: "PASSWORD_RESET",
        name: "Security Password Reset",
        subject: "Reset Your University Hub Credentials",
        text: "Hello {{username}},\n\nA request was completed to reset your security keys on the academic portal. Your security reset authorization code is: {{resetCode}}\n\nPlease input this code to finalize your passcode update.\n\nWarm regards,\nIT Systems & Security Administration",
        html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">\n  <h2 style="color: #651fff; border-bottom: 2px solid #7c4dff; padding-bottom: 10px; margin-top: 0;">Credential Security Reset</h2>\n  <p>Hello <strong>{{username}}</strong>,</p>\n  <p>We received an inquiry to reset your password. Please authorize this process by inputting the security authorization code below:</p>\n  <div style="text-align: center; margin: 30px 0;">\n    <span style="font-size: 32px; font-weight: bold; font-family: monospace; letter-spacing: 5px; color: #651fff; background: #f3e5f5; padding: 12px 30px; border-radius: 8px; border: 1px solid #e040fb; display: inline-block;">\n      {{resetCode}}\n    </span>\n  </div>\n  <p style="font-size: 13px; color: #64748b;">If you did not initiate this request, please contact the support team immediately to secure your credentials.</p>\n  <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />\n  <p style="font-size: 11px; text-align: center; color: #94a3b8; margin-bottom: 0;">University Hub IT Security Desk</p>\n</div>`
      }
    ],
    nextId: {
      users: 7,
      students: 2,
      staff: 5,
      classes: 4,
      subjects: 8,
      staffSubjects: 7,
      studentEnrollments: 2,
      feeStructures: 3,
      feePayments: 2,
      salaryStructures: 2,
      salaryPayments: 2,
      classrooms: 4,
      classroomAssignments: 7,
      grades: 3,
      attendance: 3,
      logs: 2,
      courseNotes: 3,
      quizzesAndAssignments: 3,
      studentSubmissions: 1,
    },
    sessions: []
  };
};

export class DbStore {
  private state: DbState;

  constructor() {
    this.state = this.load();
  }

  private load(): DbState {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const rawJson = fs.readFileSync(DATA_FILE, 'utf8');
        const loaded = JSON.parse(rawJson);
        // Ensure any missing arrays are initialized
        const state = {
          ...buildInitialState(),
          ...loaded,
        };

        let updated = false;
        if (!loaded.emailTemplates) {
          updated = true;
        }

        // Verify if Admin account for mosesgamboi272@gmail.com exists
        const adminUser = state.users.find(u => u.email.toLowerCase() === 'mosesgamboi272@gmail.com' && u.role === 'ADMIN');
        if (!adminUser) {
          const nextUserId = state.nextId.users++;
          state.users.push({
            id: nextUserId,
            username: 'moses.admin',
            email: 'mosesgamboi272@gmail.com',
            role: 'ADMIN',
            isActive: true,
            createdAt: new Date().toISOString(),
            password: 'password'
          });
          state.logs.push({
            id: state.nextId.logs++,
            userId: 1,
            username: 'system',
            role: 'SYSTEM',
            action: 'SEED_ADMIN',
            details: 'Automatically seeded Admin account for mosesgamboi272@gmail.com',
            timestamp: new Date().toISOString()
          });
          updated = true;
        }

        // Verify if Staff Tutor account for mosesgamboi272@gmail.com exists
        const staffUser = state.users.find(u => u.email.toLowerCase() === 'mosesgamboi272@gmail.com' && u.role === 'STAFF');
        if (!staffUser) {
          const nextUserId = state.nextId.users++;
          state.users.push({
            id: nextUserId,
            username: 'moses.staff',
            email: 'mosesgamboi272@gmail.com',
            role: 'STAFF',
            isActive: true,
            createdAt: new Date().toISOString(),
            password: 'password'
          });

          const nextStaffId = state.nextId.staff++;
          state.staff.push({
            id: nextStaffId,
            userId: nextUserId,
            staffId: `STF${String(nextStaffId).padStart(3, '0')}`,
            firstName: 'Moses',
            lastName: 'Gamboi',
            position: 'Creative Studio Tutor',
            department: 'Mechanical Engineering',
            qualification: 'M.Sc. in Engineering & Fluid Dynamics',
            joiningDate: new Date().toISOString().split('T')[0],
            phone: '0717161616',
            email: 'mosesgamboi272@gmail.com',
            address: '734 Academic Pavilion, Mechanical Wing',
            status: 'ACTIVE'
          });

          // Preallocated Thermodynamics (Id: 4) subject for mechanical engineering
          const ssId4 = state.nextId.staffSubjects++;
          state.staffSubjects.push({
            id: ssId4,
            staffId: nextStaffId,
            subjectId: 4,
            academicYear: '2024'
          });

          // Preallocated Fluid Mechanics (Id: 5) subject for mechanical engineering
          const ssId5 = state.nextId.staffSubjects++;
          state.staffSubjects.push({
            id: ssId5,
            staffId: nextStaffId,
            subjectId: 5,
            academicYear: '2024'
          });

          state.logs.push({
            id: state.nextId.logs++,
            userId: 1,
            username: 'system',
            role: 'SYSTEM',
            action: 'SEED_STAFF',
            details: 'Automatically seeded Staff Tutor account for mosesgamboi272@gmail.com with Mechanical Engineering subjects',
            timestamp: new Date().toISOString()
          });
          updated = true;
        }

        if (updated) {
          this.saveState(state);
        }

        return state;
      }
    } catch (e) {
      console.warn("Failed to load university_data.json, resetting to initial state", e);
    }
    const initial = buildInitialState();
    this.saveState(initial);
    return initial;
  }

  private save(): void {
    this.saveState(this.state);
  }

  private saveState(state: DbState): void {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to save university_data.json", e);
    }
  }

  public getState(): DbState {
    return this.state;
  }

  private getNextId(table: keyof DbState['nextId']): number {
    const id = this.state.nextId[table] || 1;
    this.state.nextId[table] = id + 1;
    return id;
  }

  // --- LOGGING ---
  public log(userId: number, username: string, role: string, action: string, details: string) {
    const logItem: SystemLog = {
      id: this.getNextId('logs'),
      userId,
      username,
      role,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.state.logs.unshift(logItem); // Show newest logs first
    if (this.state.logs.length > 500) {
      this.state.logs.pop(); // Cap it
    }
    this.save();
  }

  // --- AUTHENTICATION helpers ---
  public findUserByUsername(username: string): User | undefined {
    return this.state.users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.isActive);
  }

  public findUserById(id: number): User | undefined {
    return this.state.users.find(u => u.id === id);
  }

  public createStudentUser(username: string, email: string): User {
    const user: User = {
      id: this.getNextId('users'),
      username,
      email,
      role: 'STUDENT',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    this.state.users.push(user);
    this.save();
    return user;
  }

  public createStaffUser(username: string, email: string): User {
    const user: User = {
      id: this.getNextId('users'),
      username,
      email,
      role: 'STAFF',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    this.state.users.push(user);
    this.save();
    return user;
  }

  public getAllUsers(): User[] {
    return this.state.users;
  }

  public setUserActiveState(id: number, isActive: boolean): boolean {
    const user = this.state.users.find(u => u.id === id);
    if (user) {
      user.isActive = isActive;
      this.save();
      return true;
    }
    return false;
  }

  public setUserResetCode(id: number, code: string): boolean {
    const user = this.state.users.find(u => u.id === id);
    if (user) {
      user.verificationCode = code;
      this.save();
      return true;
    }
    return false;
  }

  // --- CRUD STUDENTS ---
  public getStudents() {
    return this.state.students;
  }

  public createStudent(p: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    studentId: string;
    dateOfBirth: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    phone: string;
    address: string;
    classId?: number; // Optional initial class selection
  }) {
    // 1. Create accompanying user
    const user = this.createStudentUser(p.username, p.email);

    // 2. Create student entry
    const student: Student = {
      id: this.getNextId('students'),
      userId: user.id,
      studentId: p.studentId,
      firstName: p.firstName,
      lastName: p.lastName,
      dateOfBirth: p.dateOfBirth,
      gender: p.gender,
      phone: p.phone,
      address: p.address,
      enrollmentDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      email: p.email,
      profilePic: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 500000)}?w=150`
    };

    this.state.students.push(student);

    // 3. If classId is passed, enroll immediately
    if (p.classId) {
      const enrollment: StudentEnrollment = {
        id: this.getNextId('studentEnrollments'),
        studentId: student.id,
        classId: p.classId,
        enrollmentDate: student.enrollmentDate,
        status: 'ACTIVE'
      };
      this.state.studentEnrollments.push(enrollment);
    }

    this.save();
    return student;
  }

  public updateStudent(id: number, p: Partial<Student>) {
    const index = this.state.students.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Student not found");

    const updated = { ...this.state.students[index], ...p };
    this.state.students[index] = updated;

    // Keep accompanying user email in sync if updated
    if (p.email) {
      const user = this.state.users.find(u => u.id === updated.userId);
      if (user) {
        user.email = p.email;
      }
    }
    
    this.save();
    return updated;
  }

  public deleteStudent(id: number) {
    const index = this.state.students.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Student not found");
    const student = this.state.students[index];

    // Deactivate user instead of removing to maintain integrity
    if (student.userId) {
      const user = this.state.users.find(u => u.id === student.userId);
      if (user) {
        user.isActive = false;
      }
    }

    this.state.students.splice(index, 1);
    // Remove active enrollments
    this.state.studentEnrollments = this.state.studentEnrollments.filter(e => e.studentId !== id);
    this.save();
  }

  // --- CRUD STAFF ---
  public getStaff() {
    return this.state.staff;
  }

  public createStaff(p: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    staffId: string;
    position: string;
    department: string;
    qualification: string;
    joiningDate: string;
    phone: string;
    address: string;
    basicSalary: number;
    allowances?: number;
    deductions?: number;
  }) {
    // 1. Create user
    const user = this.createStaffUser(p.username, p.email);

    // 2. Create staff entry
    const newStaff: Staff = {
      id: this.getNextId('staff'),
      userId: user.id,
      staffId: p.staffId,
      firstName: p.firstName,
      lastName: p.lastName,
      position: p.position,
      department: p.department,
      qualification: p.qualification,
      joiningDate: p.joiningDate || new Date().toISOString().split('T')[0],
      phone: p.phone,
      email: p.email,
      address: p.address,
      status: 'ACTIVE',
      profilePic: `https://images.unsplash.com/photo-${1510000000000 + Math.floor(Math.random() * 500000)}?w=150`
    };

    this.state.staff.push(newStaff);

    // 3. Set salary structure
    const salStr: SalaryStructure = {
      id: this.getNextId('salaryStructures'),
      staffId: newStaff.id,
      basicSalary: p.basicSalary || 5000,
      allowances: p.allowances || 0,
      deductions: p.deductions || 0,
      effectiveFrom: newStaff.joiningDate
    };
    this.state.salaryStructures.push(salStr);

    this.save();
    return newStaff;
  }

  public updateStaff(id: number, p: Partial<Staff>) {
    const index = this.state.staff.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Staff not found");

    const updated = { ...this.state.staff[index], ...p };
    this.state.staff[index] = updated;

    // Keep accompanying user email in sync if updated
    if (p.email) {
      const user = this.state.users.find(u => u.id === updated.userId);
      if (user) {
        user.email = p.email;
      }
    }

    this.save();
    return updated;
  }

  public deleteStaff(id: number) {
    const index = this.state.staff.findIndex(s => s.id === id);
    if (index === -1) throw new Error("Staff not found");
    const staff = this.state.staff[index];

    // Deactivate user instead of deleting
    if (staff.userId) {
      const user = this.state.users.find(u => u.id === staff.userId);
      if (user) {
        user.isActive = false;
      }
    }

    this.state.staff.splice(index, 1);
    this.state.staffSubjects = this.state.staffSubjects.filter(ss => ss.staffId !== id);
    this.save();
  }

  // --- CLASSES ---
  public getClasses() {
    return this.state.classes;
  }

  public createClass(c: Omit<Class, 'id'>) {
    // Check unique class_name + section + academic_year
    const exists = this.state.classes.some(clr => 
      clr.className.toLowerCase() === c.className.toLowerCase() && 
      clr.section.toLowerCase() === c.section.toLowerCase() && 
      clr.academicYear === c.academicYear
    );
    if (exists) throw new Error("Class with this Section and Academic Year already exists.");

    const newClass: Class = {
      id: this.getNextId('classes'),
      ...c
    };
    this.state.classes.push(newClass);
    this.save();
    return newClass;
  }

  public updateClass(id: number, c: Partial<Class>) {
    const index = this.state.classes.findIndex(item => item.id === id);
    if (index === -1) throw new Error("Class not found");
    const updated = { ...this.state.classes[index], ...c };
    this.state.classes[index] = updated;
    this.save();
    return updated;
  }

  public deleteClass(id: number) {
    this.state.classes = this.state.classes.filter(c => c.id !== id);
    // Set classId null on subjects
    this.state.subjects.forEach(s => {
      if (s.classId === id) s.classId = null;
    });
    // Remove enrollments in this class
    this.state.studentEnrollments = this.state.studentEnrollments.filter(e => e.classId !== id);
    this.save();
  }

  // --- SUBJECTS ---
  public getSubjects() {
    return this.state.subjects;
  }

  public createSubject(s: Omit<Subject, 'id'>) {
    const exists = this.state.subjects.some(sub => sub.subjectCode.toUpperCase() === s.subjectCode.toUpperCase());
    if (exists) throw new Error("Subject Code must be unique");

    const newSub: Subject = {
      id: this.getNextId('subjects'),
      ...s,
      subjectCode: s.subjectCode.toUpperCase()
    };
    this.state.subjects.push(newSub);
    this.save();
    return newSub;
  }

  public updateSubject(id: number, s: Partial<Subject>) {
    const index = this.state.subjects.findIndex(item => item.id === id);
    if (index === -1) throw new Error("Subject not found");
    const updated = { ...this.state.subjects[index], ...s };
    this.state.subjects[index] = updated;
    this.save();
    return updated;
  }

  public deleteSubject(id: number) {
    this.state.subjects = this.state.subjects.filter(s => s.id !== id);
    this.state.staffSubjects = this.state.staffSubjects.filter(ss => ss.subjectId !== id);
    this.state.grades = this.state.grades.filter(g => g.subjectId !== id);
    this.save();
  }

  // --- STAFF ALLOCATION (SUBJECTS) ---
  public getStaffSubjectAllocations() {
    return this.state.staffSubjects;
  }

  public allocateStaffSubject(staffId: number, subjectId: number, academicYear: string) {
    const exists = this.state.staffSubjects.some(ss => 
      ss.staffId === staffId && ss.subjectId === subjectId && ss.academicYear === academicYear
    );
    if (exists) throw new Error("Staff is already allocated to this Subject for this Academic Year");

    const allocation: StaffSubject = {
      id: this.getNextId('staffSubjects'),
      staffId,
      subjectId,
      academicYear
    };
    this.state.staffSubjects.push(allocation);
    this.save();
    return allocation;
  }

  public deallocateStaffSubject(id: number) {
    this.state.staffSubjects = this.state.staffSubjects.filter(ss => ss.id !== id);
    this.save();
  }

  // --- CLASSROOMS & SCHEDULING ---
  public getClassrooms() {
    return this.state.classrooms;
  }

  public createClassroom(r: Omit<Classroom, 'id'>) {
    const exists = this.state.classrooms.some(rm => rm.roomNumber.toUpperCase() === r.roomNumber.toUpperCase());
    if (exists) throw new Error("Room Number must be unique");

    const newRoom: Classroom = {
      id: this.getNextId('classrooms'),
      roomNumber: r.roomNumber.toUpperCase(),
      ...r
    };
    this.state.classrooms.push(newRoom);
    this.save();
    return newRoom;
  }

  public updateClassroom(id: number, r: Partial<Classroom>) {
    const index = this.state.classrooms.findIndex(rm => rm.id === id);
    if (index === -1) throw new Error("Classroom not found");
    const updated = { ...this.state.classrooms[index], ...r };
    this.state.classrooms[index] = updated;
    this.save();
    return updated;
  }

  public deleteClassroom(id: number) {
    this.state.classrooms = this.state.classrooms.filter(rm => rm.id !== id);
    this.state.classroomAssignments = this.state.classroomAssignments.filter(ca => ca.classroomId !== id);
    this.save();
  }

  public getClassroomAssignments() {
    return this.state.classroomAssignments;
  }

  public assignClassroom(a: Omit<ClassroomAssignment, 'id'>) {
    // Simple conflict check: same room, same day, overlapping time
    // For a real prototype, let's allow assigning or warn if they want, but let's check basic overlapping times
    const conflict = this.state.classroomAssignments.some(ca => {
      if (ca.classroomId === a.classroomId && ca.dayOfWeek === a.dayOfWeek && ca.academicYear === a.academicYear) {
        // Simple overlap check (HH:MM vs HH:MM)
        return (a.startTime >= ca.startTime && a.startTime < ca.endTime) ||
               (a.endTime > ca.startTime && a.endTime <= ca.endTime);
      }
      return false;
    });

    if (conflict) {
      throw new Error("Schedule Conflict! The chosen Classroom is busy at this slot.");
    }

    const assignment: ClassroomAssignment = {
      id: this.getNextId('classroomAssignments'),
      ...a
    };
    this.state.classroomAssignments.push(assignment);
    this.save();
    return assignment;
  }

  public removeClassroomAssignment(id: number) {
    this.state.classroomAssignments = this.state.classroomAssignments.filter(ca => ca.id !== id);
    this.save();
  }

  // --- FEES & PAYMENTS ---
  public getFeeStructures() {
    return this.state.feeStructures;
  }

  public configureFeeStructure(f: Omit<FeeStructure, 'id'>) {
    const index = this.state.feeStructures.findIndex(fs => fs.classId === f.classId && fs.academicYear === f.academicYear);
    if (index !== -1) {
      // update
      const updated = { ...this.state.feeStructures[index], ...f };
      this.state.feeStructures[index] = updated;
      this.save();
      return updated;
    } else {
      // create
      const brandNew: FeeStructure = {
        id: this.getNextId('feeStructures'),
        ...f
      };
      this.state.feeStructures.push(brandNew);
      this.save();
      return brandNew;
    }
  }

  public getFeePayments() {
    return this.state.feePayments;
  }

  public processFeePayment(studentId: number, p: {
    amountPaid: number;
    paymentMethod: FeePayment['paymentMethod'];
    transactionId: string;
    remarks: string;
    academicYear: string;
  }) {
    const student = this.state.students.find(s => s.id === studentId);
    if (!student) throw new Error("Student not found");

    const receiptNo = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment: FeePayment = {
      id: this.getNextId('feePayments'),
      studentId,
      amountPaid: p.amountPaid,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: p.paymentMethod,
      transactionId: p.transactionId,
      receiptNo,
      remarks: p.remarks,
      academicYear: p.academicYear
    };

    this.state.feePayments.push(payment);
    this.save();
    return payment;
  }

  // --- SALARY & PAYMENTS ---
  public getSalaryStructures() {
    return this.state.salaryStructures;
  }

  public getSalaryPayments() {
    return this.state.salaryPayments;
  }

  public processSalaryPayment(staffId: number, p: {
    amount: number;
    month: number;
    year: number;
    paymentMethod: SalaryPayment['paymentMethod'];
    transactionId: string;
  }) {
    const staffMember = this.state.staff.find(s => s.id === staffId);
    if (!staffMember) throw new Error("Staff member not found");

    // Check if already paid for this month/year
    const alreadyPaid = this.state.salaryPayments.some(sp => sp.staffId === staffId && sp.month === p.month && sp.year === p.year && sp.status === 'PAID');
    if (alreadyPaid) throw new Error(`Salary already paid to ${staffMember.firstName} for ${p.month}/${p.year}`);

    const pymt: SalaryPayment = {
      id: this.getNextId('salaryPayments'),
      staffId,
      amount: p.amount,
      paymentDate: new Date().toISOString().split('T')[0],
      month: p.month,
      year: p.year,
      paymentMethod: p.paymentMethod,
      transactionId: p.transactionId,
      status: 'PAID'
    };

    this.state.salaryPayments.push(pymt);
    this.save();
    return pymt;
  }

  // --- GRADES ---
  public getGrades() {
    return this.state.grades;
  }

  public updateGrade(studentId: number, subjectId: number, p: {
    marksObtained: number;
    totalMarks?: number;
    grade: string;
    examType: Grade['examType'];
    academicYear: string;
  }) {
    // Check if direct existing grade
    const index = this.state.grades.findIndex(g => 
      g.studentId === studentId && 
      g.subjectId === subjectId && 
      g.examType === p.examType && 
      g.academicYear === p.academicYear
    );

    if (index !== -1) {
      this.state.grades[index] = {
        ...this.state.grades[index],
        ...p,
        totalMarks: p.totalMarks ?? 100
      };
      this.save();
      return this.state.grades[index];
    } else {
      const newGrade: Grade = {
        id: this.getNextId('grades'),
        studentId,
        subjectId,
        marksObtained: p.marksObtained,
        totalMarks: p.totalMarks ?? 100,
        grade: p.grade,
        examType: p.examType,
        academicYear: p.academicYear
      };
      this.state.grades.push(newGrade);
      this.save();
      return newGrade;
    }
  }

  // --- ENROLLMENTS ---
  public enrollStudentInClass(studentId: number, classId: number) {
    const exists = this.state.studentEnrollments.some(e => e.studentId === studentId && e.classId === classId && e.status === 'ACTIVE');
    if (exists) throw new Error("Student is already active in this Class.");

    const enrollment: StudentEnrollment = {
      id: this.getNextId('studentEnrollments'),
      studentId,
      classId,
      enrollmentDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    };
    this.state.studentEnrollments.push(enrollment);
    this.save();
    return enrollment;
  }

  public updateEnrollmentStatus(enrollmentId: number, status: StudentEnrollment['status']) {
    const index = this.state.studentEnrollments.findIndex(e => e.id === enrollmentId);
    if (index === -1) throw new Error("Enrollment record not found");
    this.state.studentEnrollments[index].status = status;
    this.save();
    return this.state.studentEnrollments[index];
  }

  // --- ATTENDANCE ---
  public getAttendance() {
    return this.state.attendance;
  }

  public saveAttendance(studentId: number, subjectId: number, date: string, status: Attendance['status']) {
    const index = this.state.attendance.findIndex(a => a.studentId === studentId && a.subjectId === subjectId && a.date === date);
    if (index !== -1) {
      this.state.attendance[index].status = status;
      this.save();
      return this.state.attendance[index];
    } else {
      const item: Attendance = {
        id: this.getNextId('attendance'),
        studentId,
        subjectId,
        date,
        status
      };
      this.state.attendance.push(item);
      this.save();
      return item;
    }
  }

  // --- REPORT AGGREGATORS & DASHBOARD STATS ---
  public getAdminStats(startDate?: string, endDate?: string) {
    let filteredFeePayments = this.state.feePayments;
    let filteredStudents = this.state.students;
    let filteredStaff = this.state.staff;
    let filteredEnrollments = this.state.studentEnrollments;
    let filteredSalaryPayments = this.state.salaryPayments;
    let filteredGrades = this.state.grades;

    if (startDate) {
      filteredFeePayments = filteredFeePayments.filter(fp => fp.paymentDate >= startDate);
      filteredStudents = filteredStudents.filter(s => s.enrollmentDate >= startDate);
      filteredEnrollments = filteredEnrollments.filter(e => e.enrollmentDate >= startDate);
      filteredSalaryPayments = filteredSalaryPayments.filter(sp => sp.paymentDate >= startDate);
    }
    if (endDate) {
      filteredFeePayments = filteredFeePayments.filter(fp => fp.paymentDate <= endDate);
      filteredStudents = filteredStudents.filter(s => s.enrollmentDate <= endDate);
      filteredEnrollments = filteredEnrollments.filter(e => e.enrollmentDate <= endDate);
      filteredSalaryPayments = filteredSalaryPayments.filter(sp => sp.paymentDate <= endDate);
    }

    const totalStudents = filteredStudents.length;
    const totalStaff = filteredStaff.length;

    // Total Paid Revenue
    const revenue = filteredFeePayments.reduce((acc, pym) => acc + pym.amountPaid, 0);

    // Calculate pending fees
    // For each student, find their enrolled active class fee structure and subtract total they have paid
    let pendingFees = 0;
    filteredStudents.forEach(student => {
      const activeEnrollments = filteredEnrollments.filter(e => e.studentId === student.id && e.status === 'ACTIVE');
      activeEnrollments.forEach(enroll => {
        const feeStruct = this.state.feeStructures.find(fs => fs.classId === enroll.classId);
        if (feeStruct) {
          const payments = filteredFeePayments.filter(fp => fp.studentId === student.id && fp.academicYear === feeStruct.academicYear);
          const paid = payments.reduce((acc, p) => acc + p.amountPaid, 0);
          const remaining = feeStruct.totalFees - paid;
          if (remaining > 0) {
            pendingFees += remaining;
          }
        }
      });
    });

    // Recent Payments
    const recentRevenue = filteredFeePayments.slice(-5).map(fp => {
      const student = this.state.students.find(s => s.id === fp.studentId);
      return {
        id: fp.id,
        name: student ? `${student.firstName} ${student.lastName}` : `Student #${fp.studentId}`,
        amount: fp.amountPaid,
        date: fp.paymentDate,
        method: fp.paymentMethod
      };
    });

    // Recent salary payments
    const recentSalaries = filteredSalaryPayments.slice(-5).map(sp => {
      const staffMember = this.state.staff.find(s => s.id === sp.staffId);
      return {
        id: sp.id,
        name: staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : `Staff #${sp.staffId}`,
        amount: sp.amount,
        date: sp.paymentDate,
        method: sp.paymentMethod,
        period: `${sp.month}/${sp.year}`
      };
    });

    // Revenue by month for chart in Recharts format
    // E.g. [ { month: 'Jan', fees: 4000, salaries: 2400 }, ... ]
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const cashflowChart = months.map((mName, mIdx) => {
      const mNum = mIdx + 1;
      // Filter fees in this month
      const mFees = filteredFeePayments
        .filter(fp => {
          const pDate = new Date(fp.paymentDate);
          return pDate.getMonth() === mIdx;
        })
        .reduce((sum, fp) => sum + fp.amountPaid, 0);

      // Filter salaries
      const mSalaries = filteredSalaryPayments
        .filter(sp => sp.month === mNum && sp.status === 'PAID')
        .reduce((sum, sp) => sum + sp.amount, 0);

      return {
        month: mName,
        Revenue: mFees,
        Salaries: mSalaries,
      };
    });

    // Enrollment by class breakdown
    const enrollmentByClass = this.state.classes.map(cls => {
      const activeEnrolledCount = filteredEnrollments.filter(e => e.classId === cls.id && e.status === 'ACTIVE').length;
      return {
        className: `${cls.className} (${cls.section})`,
        count: activeEnrolledCount
      };
    });

    // Academic grades distribution for performance charts
    const gradingTallies: { [key: string]: number } = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
    filteredGrades.forEach(g => {
      const char = g.grade.trim().toUpperCase();
      if (char.includes('A+')) gradingTallies['A+']++;
      else if (char.startsWith('A')) gradingTallies['A']++;
      else if (char.startsWith('B')) gradingTallies['B']++;
      else if (char.startsWith('C')) gradingTallies['C']++;
      else if (char.startsWith('D')) gradingTallies['D']++;
      else gradingTallies['F']++;
    });
    
    const performanceDistribution = Object.keys(gradingTallies).map(g => ({
      grade: g,
      count: gradingTallies[g]
    }));

    return {
      totalStudents,
      totalStaff,
      revenue,
      pendingFees,
      recentRevenue,
      recentSalaries,
      cashflowChart,
      enrollmentByClass,
      performanceDistribution
    };
  }

  public createSession(token: string, userId: number, rememberMe: boolean): void {
    if (!this.state.sessions) {
      this.state.sessions = [];
    }
    const newSession: Session = {
      token,
      userId,
      lastActive: new Date().toISOString(),
      rememberMe,
      createdAt: new Date().toISOString(),
    };
    this.state.sessions = this.state.sessions.filter(s => s.token !== token);
    this.state.sessions.push(newSession);
    this.save();
  }

  public getSession(token: string): Session | undefined {
    if (!this.state.sessions) return undefined;
    return this.state.sessions.find(s => s.token === token);
  }

  public updateSessionActivity(token: string): boolean {
    if (!this.state.sessions) return false;
    const session = this.state.sessions.find(s => s.token === token);
    if (session) {
      session.lastActive = new Date().toISOString();
      this.save();
      return true;
    }
    return false;
  }

  public deleteSession(token: string): void {
    if (!this.state.sessions) return;
    this.state.sessions = this.state.sessions.filter(s => s.token !== token);
    this.save();
  }

  public cleanExpiredSessions(): void {
    if (!this.state.sessions) return;
    const oneWeekAgo = Date.now() - 168 * 60 * 60 * 1000;
    const initialCount = this.state.sessions.length;
    this.state.sessions = this.state.sessions.filter(s => {
      const lastActiveTime = new Date(s.lastActive).getTime();
      return lastActiveTime > oneWeekAgo;
    });
    if (this.state.sessions.length !== initialCount) {
      this.save();
    }
  }
}
