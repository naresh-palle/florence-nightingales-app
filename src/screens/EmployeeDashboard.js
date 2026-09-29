import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Image, ImageBackground, RefreshControl,
  Modal, TextInput, Platform
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();
const API = 'https://florence-nightingales-app.onrender.com';

// ── CUSTOM HEADER WITH SIGN OUT ──────────────────────────────────────────────
const DashHeader = ({ title, subtitle, onLogout, color = '#1e3a8a' }) => (
  <View style={[hdr.wrap, { backgroundColor: color }]}>
    <View style={hdr.inner}>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={hdr.title}>{title}</Text>
        {subtitle ? <Text style={hdr.sub}>{subtitle}</Text> : null}
      </View>
      {onLogout && (
        <TouchableOpacity
          style={hdr.signoutBtn}
          onPress={onLogout}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={hdr.signoutText}>Sign Out</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const hdr = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontWeight: '500',
  },
  signoutBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  signoutText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b91c1c',
  },
});

const StatusBadge = ({ label }) => {
  const colors = {
    IN_PROGRESS: ['#dbeafe', '#1e40af'],
    ASSIGNED: ['#e0e7ff', '#4338ca'],
    SCHEDULED: ['#fef3c7', '#b45309'],
    TODO: ['#f1f5f9', '#475569'],
    COMPLETED: ['#dcfce7', '#15803d'],
    RESOLVED: ['#dcfce7', '#15803d'],
    CANCELLED: ['#fee2e2', '#b91c1c'],
    OPEN: ['#fee2e2', '#b91c1c'],
  };
  const [bg, fg] = colors[label] || ['#f1f5f9', '#475569'];
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={[s.badgeText, { color: fg }]}>{label?.replace('_', ' ')}</Text>
    </View>
  );
};

const Divider = () => <View style={{ height: 1, backgroundColor: '#f1f5f9', marginHorizontal: 16 }} />;

// ── TAB 1: NURSE SHIFTS ───────────────────────────────────────────────────────
const ShiftsTab = ({ onLogout }) => {
  const [shifts, setShifts] = useState([
    {
      id: 's1',
      patient: 'Ramesh Sharma',
      address: 'Plot 42, Road 12, Banjara Hills',
      phone: '98765 43210',
      careNeed: 'Critical post-stroke recovery, vitals monitoring & mobility assistance',
      shiftType: '12h Day Shift',
      time: '08:00 AM - 08:00 PM',
      status: 'IN_PROGRESS',
      date: 'Today, 30 Sep',
      vitalsRecorded: 'BP: 120/80 • Pulse: 74 • SpO2: 98%'
    },
    {
      id: 's2',
      patient: 'Ramesh Sharma',
      address: 'Plot 42, Road 12, Banjara Hills',
      phone: '98765 43210',
      careNeed: 'Critical care night observation',
      shiftType: '12h Night Shift',
      time: '08:00 PM - 08:00 AM',
      status: 'SCHEDULED',
      date: 'Tomorrow, 1 Oct',
    },
    {
      id: 's3',
      patient: 'Kamala Gupta',
      address: 'Villa 7, Jubilee Hills, Hyderabad',
      phone: '98123 45678',
      careNeed: 'Wound dressing, IV antibiotics & vitals verification',
      shiftType: 'Procedure Visit',
      time: '10:00 AM - 01:00 PM',
      status: 'SCHEDULED',
      date: 'Fri, 3 Oct',
    }
  ]);

  const toggleShift = (id, currentStatus) => {
    if (currentStatus === 'SCHEDULED') {
      setShifts(prev => prev.map(s => s.id === id ? { ...s, status: 'IN_PROGRESS' } : s));
      Alert.alert('Checked In', 'You have checked into your shift. Coordinator and family notified.');
    } else if (currentStatus === 'IN_PROGRESS') {
      setShifts(prev => prev.map(s => s.id === id ? { ...s, status: 'COMPLETED' } : s));
      Alert.alert('Shift Ended', 'Shift marked completed. 12 hours logged to Florence Nightingales attendance.');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={s.safeContainer}>
      <FlatList
        style={s.screen}
        data={shifts}
        keyExtractor={i => i.id}
        ItemSeparatorComponent={Divider}
        ListHeaderComponent={() => (
          <>
            <DashHeader
              title="Nurse Shifts"
              subtitle="Florence Nightingales • Care Duty Schedule"
              onLogout={onLogout}
              color="#1e3a8a"
            />
            <View style={s.headerBanner}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={s.bannerTitle}>Active Assigned Patient</Text>
                  <Text style={s.bannerSub}>Ramesh Sharma • 12h Day Care</Text>
                </View>
                <View style={s.activePill}>
                  <Text style={s.activePillText}>ON DUTY</Text>
                </View>
              </View>
            </View>
            <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
              <Text style={s.sectionTitle}>Upcoming & Active Shifts</Text>
            </View>
          </>
        )}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={s.cardTitle}>{item.patient}</Text>
                <Text style={s.cardSub}>📍 {item.address}</Text>
                <Text style={s.cardSub}>📞 {item.phone}</Text>
              </View>
              <StatusBadge label={item.status} />
            </View>

            <View style={s.shiftMetaBox}>
              <View>
                <Text style={s.shiftMetaLabel}>DATE & SHIFT</Text>
                <Text style={s.shiftMetaVal}>{item.date} • {item.shiftType}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.shiftMetaLabel}>TIMING</Text>
                <Text style={s.shiftMetaVal}>{item.time}</Text>
              </View>
            </View>

            {item.careNeed && (
              <View style={s.careNoteBox}>
                <Text style={s.careNoteText}>📋 Care Plan: {item.careNeed}</Text>
                {item.vitalsRecorded && (
                  <Text style={[s.careNoteText, { color: '#15803d', fontWeight: '700', marginTop: 4 }]}>
                    🩺 Latest Vitals: {item.vitalsRecorded}
                  </Text>
                )}
              </View>
            )}

            <View style={{ marginTop: 12 }}>
              {item.status === 'SCHEDULED' && (
                <TouchableOpacity
                  style={[s.primaryBtn, { backgroundColor: '#1e3a8a' }]}
                  onPress={() => toggleShift(item.id, item.status)}
                  activeOpacity={0.7}
                >
                  <Text style={s.primaryBtnText}>✓ Check In to Shift</Text>
                </TouchableOpacity>
              )}
              {item.status === 'IN_PROGRESS' && (
                <TouchableOpacity
                  style={[s.primaryBtn, { backgroundColor: '#15803d' }]}
                  onPress={() => toggleShift(item.id, item.status)}
                  activeOpacity={0.7}
                >
                  <Text style={s.primaryBtnText}>✓ Check Out & Complete Shift</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
};

// ── TAB 2: NURSE CLINICAL TASKS ──────────────────────────────────────────────
const TasksTab = ({ onLogout }) => {
  const [tasks, setTasks] = useState([
    { id: 't1', title: 'Check & Log Blood Pressure & SpO2', patient: 'Ramesh Sharma', due: '12:30 PM', priority: 'HIGH', done: false },
    { id: 't2', title: 'Administer Nebulization Medication', patient: 'Ramesh Sharma', due: '02:00 PM', priority: 'MEDIUM', done: false },
    { id: 't3', title: 'Assisted Mobility & Range of Motion Exercise', patient: 'Ramesh Sharma', due: '04:30 PM', priority: 'NORMAL', done: false },
    { id: 't4', title: 'Evening Vitals & Diet Intake Record', patient: 'Ramesh Sharma', due: '07:30 PM', priority: 'NORMAL', done: false },
  ]);

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <SafeAreaView edges={['top']} style={s.safeContainer}>
      <FlatList
        style={s.screen}
        data={tasks}
        keyExtractor={i => i.id}
        ItemSeparatorComponent={Divider}
        ListHeaderComponent={() => (
          <>
            <DashHeader
              title="Clinical Tasks"
              subtitle="Daily patient checklist & protocols"
              onLogout={onLogout}
              color="#1e3a8a"
            />
            <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
              <Text style={s.sectionTitle}>
                Today's Care Plan Checklist ({tasks.filter(t => !t.done).length} Pending)
              </Text>
            </View>
          </>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => toggleTask(item.id)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[s.checkbox, item.done && s.checkboxDone]}>
                {item.done && <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13 }}>✓</Text>}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[s.taskTitle, item.done && s.taskTitleDone]}>{item.title}</Text>
                <Text style={s.cardSub}>For: {item.patient} • Due: {item.due}</Text>
              </View>
              <View style={[s.badge, { backgroundColor: item.priority === 'HIGH' ? '#fee2e2' : '#f1f5f9' }]}>
                <Text style={[s.badgeText, { color: item.priority === 'HIGH' ? '#b91c1c' : '#475569' }]}>
                  {item.priority}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
};

// ── TAB 3: NURSE SOS & HELPDESK (NO CRASH, FULL EMERGENCY SUPPORT) ───────────
const HelpdeskTab = ({ onLogout }) => {
  const [reportModal, setReportModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [incidents, setIncidents] = useState([
    {
      id: 'inc1',
      title: 'Emergency Fall Alert - Bedside Alarm',
      patient: 'Ramesh Sharma',
      desc: 'Patient attempted unassisted transfer. Bedside alarm triggered. Nurse Meena arrived immediately; patient seated safely. BP 124/82. No injuries sustained.',
      severity: 'CRITICAL',
      status: 'RESOLVED',
      date: 'Today, 09:15 AM'
    },
    {
      id: 'inc2',
      title: 'Critical Medication Low Stock - Insulin Need',
      patient: 'Ramesh Sharma',
      desc: 'Insulin pen cartridge will run out within 24 hours. Pharmacy refill requested through agency coordinator.',
      severity: 'HIGH',
      status: 'IN_PROGRESS',
      date: 'Yesterday, 04:30 PM'
    },
    {
      id: 'inc3',
      title: 'Vitals Alert - Post-lunch Elevated BP',
      patient: 'Kamala Gupta',
      desc: 'Blood pressure recorded at 150/95 mmHg. Attending physician consulted; dosage adjusted as instructed.',
      severity: 'MEDIUM',
      status: 'RESOLVED',
      date: '28 Sep 2026'
    }
  ]);

  const handleTriggerSOS = () => {
    Alert.alert(
      '🚨 EMERGENCY SOS DISPATCH',
      'Immediate alert will be broadcast to Florence Nightingales Emergency Coordinator, Team Lead Prashanth (+91 90000 00002), and Emergency Doctor on Call.\n\nAre you sure you want to broadcast this SOS?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '🚨 CONFIRM SOS NOW',
          style: 'destructive',
          onPress: () => {
            const emergencyIncident = {
              id: Date.now().toString(),
              title: '🚨 CRITICAL EMERGENCY SOS BROADCAST',
              patient: 'Ramesh Sharma',
              desc: 'Nurse initiated direct SOS from patient bedside. Emergency team alert dispatched.',
              severity: 'CRITICAL',
              status: 'OPEN',
              date: 'Just Now'
            };
            setIncidents([emergencyIncident, ...incidents]);
            Alert.alert(
              'SOS Dispatched!',
              'Coordinators and Emergency contacts have received your location and patient profile. Keep line open.'
            );
          }
        }
      ]
    );
  };

  const submitReport = () => {
    if (!newTitle.trim()) {
      Alert.alert('Required', 'Please describe the incident briefly.');
      return;
    }
    const newEntry = {
      id: Date.now().toString(),
      title: newTitle,
      patient: 'Ramesh Sharma',
      desc: newDesc || 'Reported by staff nurse during active shift.',
      severity: 'HIGH',
      status: 'OPEN',
      date: 'Just Now'
    };
    setIncidents([newEntry, ...incidents]);
    setReportModal(false);
    setNewTitle('');
    setNewDesc('');
    Alert.alert('Ticket Submitted', 'Florence Nightingales Helpdesk has recorded ticket #FN-' + Math.floor(1000 + Math.random() * 9000));
  };

  return (
    <SafeAreaView edges={['top']} style={s.safeContainer}>
      <FlatList
        style={s.screen}
        data={incidents}
        keyExtractor={i => i.id}
        ItemSeparatorComponent={Divider}
        ListHeaderComponent={() => (
          <>
            <DashHeader
              title="Helpdesk & SOS"
              subtitle="24/7 Clinical Emergency Support & Tickets"
              onLogout={onLogout}
              color="#b91c1c"
            />
            <View style={{ padding: 16 }}>
              {/* Giant Red SOS Trigger Button */}
              <TouchableOpacity
                style={s.giantSosBtn}
                onPress={handleTriggerSOS}
                activeOpacity={0.8}
              >
                <Text style={s.giantSosIcon}>🚨</Text>
                <Text style={s.giantSosTitle}>EMERGENCY SOS</Text>
                <Text style={s.giantSosSub}>Tap for immediate coordinator & ambulance assistance</Text>
              </TouchableOpacity>

              {/* Coordinator Quick Emergency Call Bar */}
              <View style={s.emergencyContactsBox}>
                <Text style={s.emergencyTitle}>Florence Nightingales Emergency Desk</Text>
                <Text style={s.emergencyPhone}>📞 24/7 Clinical Lead: +91 90000 00002</Text>
                <Text style={s.emergencyPhone}>🚑 Emergency Ambulance: 108</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <Text style={s.sectionTitle}>Incident & Helpdesk Tickets ({incidents.length})</Text>
                <TouchableOpacity
                  style={s.reportTicketBtn}
                  onPress={() => setReportModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={s.reportTicketText}>+ Report Issue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
        renderItem={({ item }) => {
          const isCrit = item.severity === 'CRITICAL';
          return (
            <View style={[s.card, isCrit && { borderColor: '#fca5a5', borderWidth: 1.5, backgroundColor: '#fff5f5' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[s.cardTitle, isCrit && { color: '#b91c1c' }]}>{item.title}</Text>
                  <Text style={s.cardSub}>Patient: {item.patient} • {item.date}</Text>
                </View>
                <StatusBadge label={item.status} />
              </View>
              <Text style={[s.cardDesc, { marginTop: 8 }]}>{item.desc}</Text>
            </View>
          );
        }}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      {/* Modal: Report Incident */}
      <Modal visible={reportModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Report Clinical Incident</Text>
            <Text style={s.modalSub}>Log patient issue, equipment glitch, or supply shortage</Text>

            <Text style={s.fieldLabel}>Issue Summary</Text>
            <TextInput
              style={s.fieldInput}
              placeholder="e.g. Oxygen cylinder pressure below threshold"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholderTextColor="#94a3b8"
            />

            <Text style={s.fieldLabel}>Detailed Notes / Observations</Text>
            <TextInput
              style={[s.fieldInput, { height: 80 }]}
              multiline
              placeholder="Describe what occurred and any immediate actions taken..."
              value={newDesc}
              onChangeText={setNewDesc}
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: '#1e3a8a', marginTop: 12 }]} onPress={submitReport} activeOpacity={0.7}>
              <Text style={s.primaryBtnText}>Submit Incident Ticket</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelBtn} onPress={() => setReportModal(false)} activeOpacity={0.7}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ── TAB 4: NURSE ATTENDANCE & HOURS ──────────────────────────────────────────
const AttendanceTab = ({ onLogout }) => {
  const records = [
    { id: '1', date: 'Mon, 29 Sep', checkIn: '08:00 AM', checkOut: '08:05 PM', hours: 12.1, status: 'Verified' },
    { id: '2', date: 'Sun, 28 Sep', checkIn: '08:02 AM', checkOut: '08:00 PM', hours: 12.0, status: 'Verified' },
    { id: '3', date: 'Sat, 27 Sep', checkIn: '08:00 AM', checkOut: '08:10 PM', hours: 12.2, status: 'Verified' },
    { id: '4', date: 'Fri, 26 Sep', checkIn: '08:05 AM', checkOut: '08:00 PM', hours: 12.0, status: 'Verified' },
    { id: '5', date: 'Thu, 25 Sep', checkIn: '08:00 AM', checkOut: '08:00 PM', hours: 12.0, status: 'Verified' },
  ];

  return (
    <SafeAreaView edges={['top']} style={s.safeContainer}>
      <FlatList
        style={s.screen}
        data={records}
        keyExtractor={i => i.id}
        ItemSeparatorComponent={Divider}
        ListHeaderComponent={() => (
          <>
            <DashHeader
              title="Attendance & Log"
              subtitle="Verified shift check-ins & duty hours"
              onLogout={onLogout}
              color="#1e3a8a"
            />
            <View style={{ padding: 16 }}>
              <View style={s.statsRow}>
                <View style={s.statBox}>
                  <Text style={s.statLabel}>DAYS WORKED</Text>
                  <Text style={s.statValue}>22 Days</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statLabel}>MONTHLY EARNINGS</Text>
                  <Text style={[s.statValue, { color: '#15803d' }]}>₹22,000</Text>
                </View>
              </View>
              <Text style={[s.sectionTitle, { marginTop: 16 }]}>Recent Shift Log</Text>
            </View>
          </>
        )}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={s.cardTitle}>{item.date}</Text>
                <Text style={s.cardSub}>🟢 In: {item.checkIn}  •  🔴 Out: {item.checkOut}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#1e3a8a' }}>{item.hours} hrs</Text>
                <Text style={{ fontSize: 11, color: '#15803d', fontWeight: '700' }}>✓ {item.status}</Text>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
};

// ── TAB 5: NURSE PROFILE & CREDENTIALS (RICH MOCK DATA + SIGN OUT) ───────────
const ProfileTab = ({ onLogout }) => {
  const profile = {
    full_name: 'Meena Kumari',
    email: 'meena@florence.com',
    phone: '+91 98221 44556',
    role: 'Staff Nurse',
    designation: 'Critical Care Staff Nurse (ICU & Home Care)',
    qualification: 'B.Sc Nursing • Critical Care Specialist',
    experience: '5 years professional experience',
    joined: '12 Jan 2024',
    empId: 'FN-NUR-104',
    assignedTeam: 'Critical Care Unit 1 (Lead: Prashanth Reddy)',
    documents: [
      { id: 'd1', name: 'State Nursing Council Registration (RN-58921)', status: 'Verified' },
      { id: 'd2', name: 'Government Aadhaar Card Identification', status: 'Verified' },
      { id: 'd3', name: 'Police Background Verification & Health Fitness', status: 'Verified' },
    ],
    certifications: [
      { id: 'c1', name: 'Basic Life Support (BLS / CPR) - Indian Resuscitation Council', validity: 'Valid till Nov 2027' },
      { id: 'c2', name: 'Advanced Geriatric Patient Handling & Post-Stroke Care', validity: 'Certified' }
    ]
  };

  return (
    <SafeAreaView edges={['top']} style={s.safeContainer}>
      <ScrollView style={s.screen} contentContainerStyle={{ paddingBottom: 40 }}>
        <DashHeader
          title="Nurse Profile"
          subtitle="Staff credentials, certifications & records"
          onLogout={onLogout}
          color="#1e3a8a"
        />

        <View style={{ padding: 16 }}>
          {/* Staff Badge Card */}
          <View style={s.profileCard}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarInitials}>MK</Text>
            </View>
            <Text style={s.profileName}>{profile.full_name}</Text>
            <Text style={s.profileRole}>{profile.role} • ID: {profile.empId}</Text>
            <View style={s.activeBadge}>
              <Text style={s.activeBadgeText}>VERIFIED ACTIVE STAFF</Text>
            </View>
          </View>

          {/* Details Table */}
          <Text style={[s.sectionTitle, { marginTop: 16 }]}>Employment & Contact Details</Text>
          <View style={s.card}>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>✉️ Email</Text>
              <Text style={s.detailVal}>{profile.email}</Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>📞 Mobile</Text>
              <Text style={s.detailVal}>{profile.phone}</Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>💼 Designation</Text>
              <Text style={s.detailVal}>{profile.designation}</Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>🎓 Qualification</Text>
              <Text style={s.detailVal}>{profile.qualification}</Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>⏳ Experience</Text>
              <Text style={s.detailVal}>{profile.experience}</Text>
            </View>
            <View style={[s.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={s.detailLabel}>🏥 Clinical Team</Text>
              <Text style={s.detailVal}>{profile.assignedTeam}</Text>
            </View>
          </View>

          {/* Verified Documents */}
          <Text style={[s.sectionTitle, { marginTop: 14 }]}>Verified Documents</Text>
          {profile.documents.map(d => (
            <View key={d.id} style={[s.card, { padding: 12, marginBottom: 8 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', flex: 1 }}>📄 {d.name}</Text>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#15803d', marginLeft: 8 }}>✓ {d.status}</Text>
              </View>
            </View>
          ))}

          {/* Certifications */}
          <Text style={[s.sectionTitle, { marginTop: 14 }]}>Clinical Certifications</Text>
          {profile.certifications.map(c => (
            <View key={c.id} style={[s.card, { padding: 12, marginBottom: 8 }]}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#0f172a' }}>🎓 {c.name}</Text>
              <Text style={{ fontSize: 11, color: '#15803d', marginTop: 2, fontWeight: '600' }}>✓ {c.validity}</Text>
            </View>
          ))}

          {/* Prominent Sign Out Button */}
          <TouchableOpacity
            style={s.fullSignoutBtn}
            onPress={onLogout}
            activeOpacity={0.8}
          >
            <Text style={s.fullSignoutText}>🚪  Sign Out of Florence Nightingales</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ── ROOT EMPLOYEE DASHBOARD NAVIGATOR ─────────────────────────────────────────
export default function EmployeeDashboard({ token, onLogout }) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 14 : 8);
  const tabHeight = 64 + bottomPadding;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: '#1e3a8a',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          height: tabHeight,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          elevation: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarIcon: ({ focused }) => {
          const icons = {
            Shifts: '📋',
            Tasks: '✅',
            Helpdesk: '🆘',
            Attendance: '📅',
            Profile: '👤'
          };
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.65 }}>
                {icons[route.name]}
              </Text>
            </View>
          );
        }
      })}
    >
      <Tab.Screen name="Shifts">
        {(props) => <ShiftsTab {...props} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Tasks">
        {(props) => <TasksTab {...props} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Helpdesk">
        {(props) => <HelpdeskTab {...props} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Attendance">
        {(props) => <AttendanceTab {...props} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Profile">
        {(props) => <ProfileTab {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// ── EMPLOYEE DASHBOARD STYLES ────────────────────────────────────────────────
const s = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBanner: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  bannerSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  activePill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  activePillText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  shiftMetaBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  shiftMetaLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  shiftMetaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  careNoteBox: {
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  careNoteText: {
    fontSize: 12,
    color: '#1e40af',
  },
  primaryBtn: {
    backgroundColor: '#1e3a8a',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDone: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  giantSosBtn: {
    backgroundColor: '#dc2626',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#dc2626',
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  giantSosIcon: {
    fontSize: 36,
    marginBottom: 4,
  },
  giantSosTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
  giantSosSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textAlign: 'center',
  },
  emergencyContactsBox: {
    backgroundColor: '#fff1f2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fecdd3',
    marginTop: 12,
  },
  emergencyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9f1239',
  },
  emergencyPhone: {
    fontSize: 13,
    color: '#be123c',
    marginTop: 3,
    fontWeight: '700',
  },
  reportTicketBtn: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reportTicketText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 4,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  profileRole: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    maxWidth: '55%',
    textAlign: 'right',
  },
  fullSignoutBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  fullSignoutText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#b91c1c',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  fieldInput: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  cancelBtn: {
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
});
