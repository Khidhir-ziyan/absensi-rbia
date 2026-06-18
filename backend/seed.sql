-- Seed data for absensi-rbia
-- Generated on 2026-06-17T23:34:46.719Z

-- Teacher account (email: guru@rbia.com, password: password123)
INSERT INTO users (id, name, email, password, role, created_at, updated_at)
VALUES ('ec30fbf0-4df4-4158-a8e9-58e369ed9ec0', 'Ustadz Abdullah', 'guru@rbia.com', '$2b$10$rwAoqi0xG3D7pfcBtOCb2uuLULU5hI2ZlNPOSF0R6HMXYsJk88GVG', 'TEACHER', unixepoch(), unixepoch());

-- Classes
INSERT INTO classes (id, name, description, teacher_id, created_at, updated_at)
VALUES ('820fad17-488d-43a5-8b45-6c7290f5cbb8', 'Kelas 4A', 'Kelas 4 semester genap', 'ec30fbf0-4df4-4158-a8e9-58e369ed9ec0', unixepoch(), unixepoch());

INSERT INTO classes (id, name, description, teacher_id, created_at, updated_at)
VALUES ('d640d64d-6f28-4c16-8b30-d6cbd5721109', 'Kelas 5B', 'Kelas 5 semester genap', 'ec30fbf0-4df4-4158-a8e9-58e369ed9ec0', unixepoch(), unixepoch());

-- Subjects
INSERT INTO subjects (id, name, description, class_id, created_at, updated_at)
VALUES ('5370558e-5b67-4d8a-b2cd-d56891a82373', 'Hafalan Quran', 'Setoran hafalan surah pendek', '820fad17-488d-43a5-8b45-6c7290f5cbb8', unixepoch(), unixepoch());

INSERT INTO subjects (id, name, description, class_id, created_at, updated_at)
VALUES ('e85f8811-6154-4caa-9d4e-70eef4a670ec', 'Matematika', 'Operasi hitung dasar', '820fad17-488d-43a5-8b45-6c7290f5cbb8', unixepoch(), unixepoch());

INSERT INTO subjects (id, name, description, class_id, created_at, updated_at)
VALUES ('87a19aa1-94b8-49b2-a79b-bd45702545e5', 'Bahasa Arab', 'Kosakata dasar', 'd640d64d-6f28-4c16-8b30-d6cbd5721109', unixepoch(), unixepoch());

-- Students
INSERT INTO students (id, name, student_id, class_id, created_at, updated_at)
VALUES ('fa6632ad-7ed4-4dc0-a288-fac5e1da0d9f', 'Ahmad Fauzi', '2024001', '820fad17-488d-43a5-8b45-6c7290f5cbb8', unixepoch(), unixepoch());
INSERT INTO students (id, name, student_id, class_id, created_at, updated_at)
VALUES ('08063298-150c-4dcb-a000-1860abf19997', 'Siti Nurhaliza', '2024002', '820fad17-488d-43a5-8b45-6c7290f5cbb8', unixepoch(), unixepoch());
INSERT INTO students (id, name, student_id, class_id, created_at, updated_at)
VALUES ('d8c33238-e50c-45e0-a24d-1aece1dd5a38', 'Muhammad Rizki', '2024003', '820fad17-488d-43a5-8b45-6c7290f5cbb8', unixepoch(), unixepoch());
INSERT INTO students (id, name, student_id, class_id, created_at, updated_at)
VALUES ('dff29407-7ec2-4b2b-9fbb-ae8fc84a743e', 'Aisyah Putri', '2024004', '820fad17-488d-43a5-8b45-6c7290f5cbb8', unixepoch(), unixepoch());
INSERT INTO students (id, name, student_id, class_id, created_at, updated_at)
VALUES ('fa95111c-4dbe-4442-b16f-0bc902a52f86', 'Budi Santoso', '2024005', 'd640d64d-6f28-4c16-8b30-d6cbd5721109', unixepoch(), unixepoch());
INSERT INTO students (id, name, student_id, class_id, created_at, updated_at)
VALUES ('0acdc789-a834-43f6-a3cb-30481fca42fc', 'Dewi Lestari', '2024006', 'd640d64d-6f28-4c16-8b30-d6cbd5721109', unixepoch(), unixepoch());
INSERT INTO students (id, name, student_id, class_id, created_at, updated_at)
VALUES ('893b3579-b5d1-4a67-9084-2186536ee222', 'Rafi Ahmad', '2024007', 'd640d64d-6f28-4c16-8b30-d6cbd5721109', unixepoch(), unixepoch());

-- Sessions (2 completed, 1 in-progress)
INSERT INTO sessions (id, subject_id, topic, date, status, created_at, updated_at)
VALUES ('1ee3b050-7c92-4043-950e-fde0ec27df58', '5370558e-5b67-4d8a-b2cd-d56891a82373', 'Surah Al-Fatihah ayat 1-3', unixepoch() - 86400 * 2, 'COMPLETED', unixepoch(), unixepoch());

INSERT INTO sessions (id, subject_id, topic, date, status, created_at, updated_at)
VALUES ('2973adaf-9250-4a28-8e94-208d5ca5a1e4', '5370558e-5b67-4d8a-b2cd-d56891a82373', 'Surah Al-Fatihah ayat 4-7', unixepoch() - 86400, 'COMPLETED', unixepoch(), unixepoch());

INSERT INTO sessions (id, subject_id, topic, date, status, created_at, updated_at)
VALUES ('9a0c50dd-248a-4742-9e63-0c31c3b20729', 'e85f8811-6154-4caa-9d4e-70eef4a670ec', 'Penjumlahan dan Pengurangan', unixepoch(), 'IN_PROGRESS', unixepoch(), unixepoch());

-- Attendance records
INSERT INTO attendance_records (id, session_id, student_id, status, created_at, updated_at)
VALUES ('66f5db68-0165-469e-9e55-2e47cca7b7ca', '1ee3b050-7c92-4043-950e-fde0ec27df58', 'fa6632ad-7ed4-4dc0-a288-fac5e1da0d9f', 'SICK', unixepoch(), unixepoch());
INSERT INTO attendance_records (id, session_id, student_id, status, created_at, updated_at)
VALUES ('7a57e223-0a23-41cb-ab6a-bd59c9057ac0', '1ee3b050-7c92-4043-950e-fde0ec27df58', '08063298-150c-4dcb-a000-1860abf19997', 'PRESENT', unixepoch(), unixepoch());
INSERT INTO attendance_records (id, session_id, student_id, status, created_at, updated_at)
VALUES ('7d0acc7d-fe80-48e1-bf2b-abdc224d3b0a', '1ee3b050-7c92-4043-950e-fde0ec27df58', 'd8c33238-e50c-45e0-a24d-1aece1dd5a38', 'PRESENT', unixepoch(), unixepoch());
INSERT INTO attendance_records (id, session_id, student_id, status, created_at, updated_at)
VALUES ('0b93d091-bd74-4827-a9ee-f1313cb24409', '1ee3b050-7c92-4043-950e-fde0ec27df58', 'dff29407-7ec2-4b2b-9fbb-ae8fc84a743e', 'PRESENT', unixepoch(), unixepoch());
INSERT INTO attendance_records (id, session_id, student_id, status, created_at, updated_at)
VALUES ('20612178-428c-436b-8d92-54b54216f2f5', '2973adaf-9250-4a28-8e94-208d5ca5a1e4', 'fa6632ad-7ed4-4dc0-a288-fac5e1da0d9f', 'EXCUSED', unixepoch(), unixepoch());
INSERT INTO attendance_records (id, session_id, student_id, status, created_at, updated_at)
VALUES ('ecb6dafa-3ca8-4c7d-a9a8-bc41a875bb59', '2973adaf-9250-4a28-8e94-208d5ca5a1e4', '08063298-150c-4dcb-a000-1860abf19997', 'EXCUSED', unixepoch(), unixepoch());
INSERT INTO attendance_records (id, session_id, student_id, status, created_at, updated_at)
VALUES ('e7e33025-49b1-4246-9f8e-7a02cd186036', '2973adaf-9250-4a28-8e94-208d5ca5a1e4', 'd8c33238-e50c-45e0-a24d-1aece1dd5a38', 'SICK', unixepoch(), unixepoch());
INSERT INTO attendance_records (id, session_id, student_id, status, created_at, updated_at)
VALUES ('6e02c388-4b00-4fe6-88bb-94ef77f6a9af', '2973adaf-9250-4a28-8e94-208d5ca5a1e4', 'dff29407-7ec2-4b2b-9fbb-ae8fc84a743e', 'EXCUSED', unixepoch(), unixepoch());
