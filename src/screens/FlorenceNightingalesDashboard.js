import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator, Image, Share, Platform, StatusBar
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();
const API = 'https://florence-nightingales-app.onrender.com';

// ── SHARED STYLES & PILLS ───────────────────────────────────────────────────
const StatusPill = ({ label }) => {
  const stylesMap = {
    Placed: { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' },
    Free: { bg: '#e0f2fe', text: '#0369a1', dot: '#0ea5e9' },
    'On leave': { bg: '#fef3c7', text: '#b45309', dot: '#f59e0b' },
    Present: { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' },
    Absent: { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' },
    Overdue: { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' },
    Active: { bg: '#dcfce7', text: '#15803d', dot: '#22c55e' },
  };
  const c = stylesMap[label] || { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' };
  return (
    <View style={[ui.pill, { backgroundColor: c.bg }]}>
      <View style={[ui.pillDot, { backgroundColor: c.dot }]} />
      <Text style={[ui.pillText, { color: c.text }]}>{label}</Text>
    </View>
  );
};

// ── TAB 1: TODAY / ATTENDANCE ────────────────────────────────────────────────
const TodayTab = ({ onLogout, navigation }) => {
  const [selectedDate, setSelectedDate] = useState('Today');
  const [absentModalVisible, setAbsentModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [attendanceList, setAttendanceList] = useState([
    { id: '1', caregiver: 'Meena Kumari', role: 'Staff Nurse', client: 'Ramesh Sharma', shift: '12h day', status: 'UNMARKED' },
    { id: '2', caregiver: 'Anita Yadav', role: 'Staff Nurse', client: 'Ramesh Sharma', shift: '12h night', status: 'UNMARKED' },
    { id: '3', caregiver: 'Sunita Devi', role: 'Caregiver', client: 'Kamala Gupta', shift: 'Live-in', status: 'UNMARKED' },
  ]);

  const markPresent = (id) => {
    setAttendanceList(prev => prev.map(item => item.id === id ? { ...item, status: 'Present' } : item));
    Alert.alert('Recorded', 'Caregiver marked present. Ledger updated.');
  };

  const openAbsentModal = (item) => {
    setSelectedItem(item);
    setAbsentModalVisible(true);
  };

  const confirmAbsent = (rule) => {
    if (!selectedItem) return;
    setAttendanceList(prev => prev.map(item => item.id === selectedItem.id ? { ...item, status: `Absent (${rule === 'DEDUCT' ? 'Deducted' : 'Paid'})` } : item));
    setAbsentModalVisible(false);
    Alert.alert('Attendance Updated', rule === 'DEDUCT' ? '1 day pro-rated deduction applied to client invoice.' : 'Marked as agreed paid absence. No deduction.');
  };

  return (
    <SafeAreaView edges={['top']} style={ui.safeContainer}>
      <ScrollView style={ui.screen} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Florence Nightingales Agency Header */}
        <View style={ui.topHeader}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={ui.agencyTitle}>Florence Nightingales</Text>
              <Text style={ui.agencySub}>Home Care Operations & Staffing • 24/7</Text>
            </View>
            {onLogout && (
              <TouchableOpacity
                onPress={onLogout}
                style={ui.signoutBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={ui.signoutText}>Sign Out</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 4 Summary Metric Cards */}
          <View style={ui.statsRow}>
            <View style={ui.statBox}>
              <Text style={ui.statLabel}>ACTIVE CLIENTS</Text>
              <Text style={ui.statValue}>3</Text>
            </View>
            <View style={ui.statBox}>
              <Text style={ui.statLabel}>ACTIVE CAREGIVERS</Text>
              <Text style={ui.statValue}>5</Text>
            </View>
          </View>
          <View style={[ui.statsRow, { marginTop: 8 }]}>
            <TouchableOpacity
              style={[ui.statBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
              onPress={() => navigation.navigate('Money')}
              activeOpacity={0.7}
            >
              <Text style={[ui.statLabel, { color: '#166534' }]}>TO COLLECT</Text>
              <Text style={[ui.statValue, { color: '#15803d' }]}>₹41,600</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ui.statBox, { backgroundColor: '#fefce8', borderColor: '#fef08a' }]}
              onPress={() => navigation.navigate('Money')}
              activeOpacity={0.7}
            >
              <Text style={[ui.statLabel, { color: '#854d0e' }]}>TO PAY</Text>
              <Text style={[ui.statValue, { color: '#a16207' }]}>₹18,000</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Selector */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {['Today', 'Yesterday', '5 Jul', '4 Jul', '3 Jul'].map(d => (
              <TouchableOpacity
                key={d}
                style={[ui.datePill, selectedDate === d && ui.datePillActive]}
                onPress={() => setSelectedDate(d)}
                activeOpacity={0.7}
              >
                <Text style={[ui.datePillText, selectedDate === d && ui.datePillTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Alerts Section (Renewals & Enquiries) */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={ui.sectionHeader}>Operational Alerts</Text>
          <View style={ui.alertCard}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={ui.alertTitle}>⚠️ Sharma family renewal</Text>
              <Text style={ui.alertSub}>Due in 2 days • ₹30,000</Text>
            </View>
            <TouchableOpacity
              style={ui.alertActionBtn}
              onPress={() => navigation.navigate('Placements')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={ui.alertActionText}>Renew</Text>
            </TouchableOpacity>
          </View>
          <View style={[ui.alertCard, { marginTop: 8, borderColor: '#bae6fd', backgroundColor: '#f0f9ff' }]}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={[ui.alertTitle, { color: '#0369a1' }]}>📞 2 enquiries pending</Text>
              <Text style={[ui.alertSub, { color: '#0284c7' }]}>Waiting for coordinator follow-up</Text>
            </View>
            <TouchableOpacity
              style={[ui.alertActionBtn, { backgroundColor: '#0284c7' }]}
              onPress={() => navigation.navigate('Clients')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={ui.alertActionText}>View</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Attendance Verification */}
        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={ui.sectionHeader}>Today's Attendance</Text>
            <Text style={ui.badgeMuted}>3 assigned shifts</Text>
          </View>

          {attendanceList.map(item => (
            <View key={item.id} style={ui.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={ui.cardTitle}>{item.caregiver}</Text>
                  <Text style={ui.cardSub}>With: <Text style={{ fontWeight: '700', color: '#1e293b' }}>{item.client}</Text> • {item.shift}</Text>
                </View>
                {item.status !== 'UNMARKED' ? (
                  <StatusPill label={item.status.includes('Absent') ? 'Absent' : item.status} />
                ) : (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      style={ui.checkBtn}
                      onPress={() => markPresent(item.id)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={ui.checkBtnText}>✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={ui.crossBtn}
                      onPress={() => openAbsentModal(item)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={ui.crossBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal: Absent Billing Rule Selection */}
      <Modal visible={absentModalVisible} transparent animationType="fade">
        <View style={ui.modalOverlay}>
          <View style={ui.modalCard}>
            <Text style={ui.modalTitle}>Mark Absent: {selectedItem?.caregiver}</Text>
            <Text style={ui.modalSub}>Select billing adjustment rule for {selectedItem?.client}:</Text>

            <TouchableOpacity
              style={ui.optionCard}
              onPress={() => confirmAbsent('DEDUCT')}
              activeOpacity={0.7}
            >
              <Text style={ui.optionTitle}>📉 Deduct from Client Bill</Text>
              <Text style={ui.optionSub}>Automatically credits 1 day rate back to client invoice and ledger.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[ui.optionCard, { marginTop: 10 }]}
              onPress={() => confirmAbsent('PAID')}
              activeOpacity={0.7}
            >
              <Text style={ui.optionTitle}>🛡️ Agreed Paid Absence / Replacement Sent</Text>
              <Text style={ui.optionSub}>Keep full billing without deduction (replacement staff assigned or contract allowance).</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[ui.cancelBtn, { marginTop: 14 }]}
              onPress={() => setAbsentModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={ui.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ── TAB 2: CAREGIVERS ────────────────────────────────────────────────────────
const CaregiversTab = () => {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [caregivers, setCaregivers] = useState([
    { id: '1', name: 'Rekha Sharma', phone: '98191 22334', role: 'Caregiver', status: 'Free', exp: '3 yrs', rate: '₹18,000/mo', skills: ['Elderly Care', 'Assistance'], languages: ['Hindi'] },
    { id: '2', name: 'Meena Kumari', phone: '98221 44556', role: 'Staff Nurse', status: 'Placed', client: 'Ramesh Sharma', exp: '5 yrs', rate: '₹22,000/mo', skills: ['Critical Care', 'Vitals'], languages: ['Hindi', 'English'] },
    { id: '3', name: 'Sunita Devi', phone: '98334 55667', role: 'Caregiver', status: 'Placed', client: 'Kamala Gupta', exp: '2 yrs', rate: '₹16,000/mo', skills: ['Bedridden Care', 'Palliative'], languages: ['Hindi'] },
    { id: '4', name: 'Anita Yadav', phone: '98445 66778', role: 'Staff Nurse', status: 'Placed', client: 'Ramesh Sharma', exp: '4 yrs', rate: '₹20,000/mo', skills: ['ICU Support', 'Post-Surgery'], languages: ['Hindi', 'Telugu'] },
    { id: '5', name: 'Farah Khan', phone: '98556 77889', role: 'Semi-nurse', status: 'Free', exp: '1 yr', rate: '₹15,000/mo', skills: ['Baby Care', 'Home Nursing'], languages: ['Hindi', 'English'] },
  ]);

  // Add form states
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('Caregiver');
  const [newRate, setNewRate] = useState('18000');
  const [newExp, setNewExp] = useState('2');

  const filtered = caregivers.filter(c => {
    const matchFilter = filter === 'All' ? true : c.status === filter;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    return matchFilter && matchSearch;
  });

  const handleAddCaregiver = () => {
    if (!newName || !newPhone) {
      Alert.alert('Required', 'Please enter Name and Phone number.');
      return;
    }
    const newEntry = {
      id: Date.now().toString(),
      name: newName,
      phone: newPhone,
      role: newRole,
      status: 'Free',
      exp: `${newExp} yrs`,
      rate: `₹${Number(newRate).toLocaleString('en-IN')}/mo`,
      skills: ['Elderly Care', 'Patient Assistance'],
      languages: ['Hindi']
    };
    setCaregivers([newEntry, ...caregivers]);
    setAddModal(false);
    setNewName('');
    setNewPhone('');
    Alert.alert('Caregiver Onboarded', `${newName} added to roster as Free, ready to be placed.`);
  };

  return (
    <SafeAreaView edges={['top']} style={ui.safeContainer}>
      <View style={ui.screen}>
        {/* Header with Title and Add Button */}
        <View style={ui.headerWithAction}>
          <View style={{ flex: 1 }}>
            <Text style={ui.pageTitle}>Caregivers</Text>
            <Text style={ui.pageSub}>Manage, onboard & match care staff</Text>
          </View>
          <TouchableOpacity
            style={ui.primaryAddBtn}
            onPress={() => setAddModal(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={ui.primaryAddBtnText}>+ Add Caregiver</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
          <TextInput
            style={ui.searchInput}
            placeholder="🔍  Search name or phone..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94a3b8"
          />
        </View>

        {/* Filter Pills */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {['All', 'Free', 'Placed', 'On leave'].map(f => (
              <TouchableOpacity
                key={f}
                style={[ui.filterPill, filter === f && ui.filterPillActive]}
                onPress={() => setFilter(f)}
                activeOpacity={0.7}
              >
                <Text style={[ui.filterPillText, filter === f && ui.filterPillTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Caregiver List */}
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={ui.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={ui.cardTitle}>{item.name}</Text>
                  <Text style={ui.cardSub}>📞 {item.phone} • {item.exp} exp</Text>
                  {item.client && (
                    <Text style={[ui.cardSub, { color: '#0369a1', marginTop: 2, fontWeight: '600' }]}>
                      Currently placed with: {item.client}
                    </Text>
                  )}
                </View>
                <StatusPill label={item.status} />
              </View>

              <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <Text style={ui.roleTag}>{item.role}</Text>
                {item.skills?.map(s => (
                  <View key={s} style={ui.skillTag}><Text style={ui.skillText}>{s}</Text></View>
                ))}
                <Text style={{ marginLeft: 'auto', fontSize: 13, fontWeight: '800', color: '#0f172a' }}>
                  {item.rate}
                </Text>
              </View>
            </View>
          )}
        />

        {/* Modal: Add Caregiver */}
        <Modal visible={addModal} transparent animationType="slide">
          <View style={ui.modalOverlay}>
            <View style={ui.modalCard}>
              <Text style={ui.modalTitle}>Onboard Caregiver</Text>
              <Text style={ui.modalSub}>Add caregiver to Florence Nightingales active roster</Text>

              <Text style={ui.fieldLabel}>Full Name</Text>
              <TextInput
                style={ui.fieldInput}
                placeholder="e.g. Rekha Sharma"
                value={newName}
                onChangeText={setNewName}
                placeholderTextColor="#94a3b8"
              />

              <Text style={ui.fieldLabel}>Phone Number</Text>
              <TextInput
                style={ui.fieldInput}
                placeholder="10-digit mobile number"
                keyboardType="phone-pad"
                value={newPhone}
                onChangeText={setNewPhone}
                placeholderTextColor="#94a3b8"
              />

              <Text style={ui.fieldLabel}>Role</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {['Caregiver', 'Staff Nurse', 'Semi-nurse'].map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[ui.roleSelectPill, newRole === r && ui.roleSelectPillActive]}
                    onPress={() => setNewRole(r)}
                    activeOpacity={0.7}
                  >
                    <Text style={[ui.roleSelectText, newRole === r && ui.roleSelectTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={ui.fieldLabel}>Expected Rate (₹/mo)</Text>
                  <TextInput
                    style={ui.fieldInput}
                    keyboardType="numeric"
                    value={newRate}
                    onChangeText={setNewRate}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ui.fieldLabel}>Experience (Yrs)</Text>
                  <TextInput
                    style={ui.fieldInput}
                    keyboardType="numeric"
                    value={newExp}
                    onChangeText={setNewExp}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <TouchableOpacity style={ui.submitBtn} onPress={handleAddCaregiver} activeOpacity={0.7}>
                <Text style={ui.submitBtnText}>Save to Roster</Text>
              </TouchableOpacity>

              <TouchableOpacity style={ui.cancelBtn} onPress={() => setAddModal(false)} activeOpacity={0.7}>
                <Text style={ui.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

// ── TAB 3: CLIENTS & ENQUIRIES ───────────────────────────────────────────────
const ClientsTab = () => {
  const [segment, setSegment] = useState('Enquiries');
  const [convertModal, setConvertModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('72');
  const [conditions, setConditions] = useState('Bedridden, 24h care required');
  const [familyRelation, setFamilyRelation] = useState('Daughter');

  const [enquiries, setEnquiries] = useState([
    { id: '1', name: 'Priya Nair', phone: '98191 44332', need: 'Bedridden, 24h Live-in', area: 'Banjara Hills', urgency: 'Immediate', budget: '₹28,000/mo' },
    { id: '2', name: 'Rahul Mehta', phone: '98223 11223', need: 'Elder care, 12h day', area: 'Jubilee Hills', urgency: 'Next week', budget: '₹18,000/mo' },
  ]);

  const [clients, setClients] = useState([
    { id: '1', name: 'Ramesh Sharma', phone: '98765 43210', area: 'Banjara Hills', caregiversCount: 2, caregiverName: 'Meena Kumari & Anita Yadav', dues: '₹23,600' },
    { id: '2', name: 'Kamala Gupta', phone: '98123 45678', area: 'Jubilee Hills', caregiversCount: 1, caregiverName: 'Sunita Devi', dues: '₹0 (Paid)' },
  ]);

  const openConvert = (enq) => {
    setSelectedEnquiry(enq);
    setPatientName(`${enq.name}'s Mother`);
    setConvertModal(true);
  };

  const handleConvert = () => {
    if (!selectedEnquiry) return;
    const newClient = {
      id: Date.now().toString(),
      name: selectedEnquiry.name,
      phone: selectedEnquiry.phone,
      area: selectedEnquiry.area,
      caregiversCount: 0,
      caregiverName: 'Unassigned (Ready for placement)',
      dues: '₹0'
    };
    setClients([newClient, ...clients]);
    setEnquiries(enquiries.filter(e => e.id !== selectedEnquiry.id));
    setConvertModal(false);
    setSegment('Clients');
    Alert.alert('Enquiry Converted!', `${selectedEnquiry.name} is now an active Client. Ready to place a caregiver.`);
  };

  return (
    <SafeAreaView edges={['top']} style={ui.safeContainer}>
      <View style={ui.screen}>
        {/* Header */}
        <View style={ui.headerWithAction}>
          <View>
            <Text style={ui.pageTitle}>Clients & Leads</Text>
            <Text style={ui.pageSub}>From first inquiry to continuous home care</Text>
          </View>
        </View>

        {/* Segment Switcher */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <View style={ui.segmentTrack}>
            <TouchableOpacity
              style={[ui.segmentBtn, segment === 'Enquiries' && ui.segmentBtnActive]}
              onPress={() => setSegment('Enquiries')}
              activeOpacity={0.7}
            >
              <Text style={[ui.segmentText, segment === 'Enquiries' && ui.segmentTextActive]}>
                📞 Enquiries ({enquiries.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[ui.segmentBtn, segment === 'Clients' && ui.segmentBtnActive]}
              onPress={() => setSegment('Clients')}
              activeOpacity={0.7}
            >
              <Text style={[ui.segmentText, segment === 'Clients' && ui.segmentTextActive]}>
                🤝 Clients ({clients.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {segment === 'Enquiries' ? (
          <FlatList
            data={enquiries}
            keyExtractor={i => i.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            renderItem={({ item }) => (
              <View style={ui.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={ui.cardTitle}>{item.name}</Text>
                    <Text style={ui.cardSub}>📞 {item.phone} • 📍 {item.area}</Text>
                  </View>
                  <View style={ui.tagUrgent}><Text style={ui.tagUrgentText}>{item.urgency}</Text></View>
                </View>

                <View style={{ flexDirection: 'row', gap: 6, marginVertical: 8, flexWrap: 'wrap' }}>
                  <View style={ui.skillTag}><Text style={ui.skillText}>Need: {item.need}</Text></View>
                  <View style={ui.skillTag}><Text style={ui.skillText}>Budget: {item.budget}</Text></View>
                </View>

                <TouchableOpacity
                  style={ui.convertBtn}
                  onPress={() => openConvert(item)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={ui.convertBtnText}>Convert to Client →</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        ) : (
          <FlatList
            data={clients}
            keyExtractor={i => i.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            renderItem={({ item }) => (
              <View style={ui.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={ui.cardTitle}>{item.name}</Text>
                    <Text style={ui.cardSub}>📞 {item.phone} • 📍 {item.area}</Text>
                    <Text style={[ui.cardSub, { color: '#0369a1', marginTop: 4, fontWeight: '600' }]}>
                      Assigned: {item.caregiverName}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '700' }}>OUTSTANDING</Text>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: item.dues.includes('0') ? '#15803d' : '#b91c1c' }}>
                      {item.dues}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          />
        )}

        {/* Modal: 1-Tap Convert Enquiry to Client */}
        <Modal visible={convertModal} transparent animationType="slide">
          <View style={ui.modalOverlay}>
            <View style={ui.modalCard}>
              <Text style={ui.modalTitle}>Convert Enquiry to Client</Text>
              <Text style={ui.modalSub}>All details prefilled from enquiry. Ready to place care staff.</Text>

              <View style={ui.prefillNotice}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#15803d' }}>
                  ✓ Contact: {selectedEnquiry?.name} ({selectedEnquiry?.phone})
                </Text>
                <Text style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>
                  Area: {selectedEnquiry?.area} • Need: {selectedEnquiry?.need}
                </Text>
              </View>

              <Text style={ui.fieldLabel}>Patient / Loved One's Name</Text>
              <TextInput
                style={ui.fieldInput}
                value={patientName}
                onChangeText={setPatientName}
                placeholderTextColor="#94a3b8"
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={ui.fieldLabel}>Patient Age</Text>
                  <TextInput
                    style={ui.fieldInput}
                    keyboardType="numeric"
                    value={patientAge}
                    onChangeText={setPatientAge}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ui.fieldLabel}>Relation</Text>
                  <TextInput
                    style={ui.fieldInput}
                    value={familyRelation}
                    onChangeText={setFamilyRelation}
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <Text style={ui.fieldLabel}>Medical Conditions / Care Plan</Text>
              <TextInput
                style={[ui.fieldInput, { height: 60 }]}
                multiline
                value={conditions}
                onChangeText={setConditions}
                placeholderTextColor="#94a3b8"
              />

              <TouchableOpacity style={ui.submitBtn} onPress={handleConvert} activeOpacity={0.7}>
                <Text style={ui.submitBtnText}>Confirm & Make Active Client</Text>
              </TouchableOpacity>

              <TouchableOpacity style={ui.cancelBtn} onPress={() => setConvertModal(false)} activeOpacity={0.7}>
                <Text style={ui.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

// ── TAB 4: PLACEMENTS ────────────────────────────────────────────────────────
const PlacementsTab = () => {
  const [createModal, setCreateModal] = useState(false);
  const [step, setStep] = useState(1);
  const [clientRate, setClientRate] = useState('30000');
  const [caregiverRate, setCaregiverRate] = useState('22000');
  const [shiftType, setShiftType] = useState('12h day');

  const liveMargin = Math.max(0, Number(clientRate || 0) - Number(caregiverRate || 0));
  const marginPct = Number(clientRate) > 0 ? Math.round((liveMargin / Number(clientRate)) * 100) : 0;

  const [placements, setPlacements] = useState([
    { id: '1', client: 'Ramesh Sharma', caregiver: 'Meena Kumari', shift: '12h day', clientPay: 30000, cgGet: 22000, margin: 8000, marginPct: 27, status: 'Active' },
    { id: '2', client: 'Kamala Gupta', caregiver: 'Sunita Devi', shift: 'Live-in', clientPay: 35000, cgGet: 25000, margin: 10000, marginPct: 29, status: 'Active' },
  ]);

  const handleFinishPlacement = () => {
    const newP = {
      id: Date.now().toString(),
      client: 'Priya Nair',
      caregiver: 'Rekha Sharma',
      shift: shiftType,
      clientPay: Number(clientRate),
      cgGet: Number(caregiverRate),
      margin: liveMargin,
      marginPct,
      status: 'Active'
    };
    setPlacements([newP, ...placements]);
    setCreateModal(false);
    setStep(1);
    Alert.alert('Placement Created!', 'Caregiver placed and invoice of ₹' + Number(clientRate).toLocaleString('en-IN') + ' created.');
  };

  const handleReplace = (item) => {
    Alert.alert(
      'Replace Caregiver',
      `Pick a replacement caregiver for ${item.caregiver}. Free caregivers appear automatically.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Swap with Rekha Sharma',
          onPress: () => {
            setPlacements(prev => prev.map(p => p.id === item.id ? { ...p, caregiver: 'Rekha Sharma' } : p));
            Alert.alert('Caregiver Swapped', 'Rekha Sharma placed. Previous caregiver freed.');
          }
        }
      ]
    );
  };

  const handleRemove = (item) => {
    Alert.alert(
      'Remove Caregiver',
      `Remove caregiver from ${item.client}? Unserved days will be credited back to the client ledger.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove & Credit Pro-rata',
          style: 'destructive',
          onPress: () => {
            setPlacements(prev => prev.filter(p => p.id !== item.id));
            Alert.alert('Removed', 'Caregiver freed. Pro-rated credit applied to client account.');
          }
        }
      ]
    );
  };

  const handleRenew = (item) => {
    Alert.alert(
      'Renew Placement',
      `Roll placement for ${item.client} into next 30-day billing cycle?\nClient pays: ₹${item.clientPay}\nCaregiver gets: ₹${item.cgGet}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Renewal & Send Invoice',
          onPress: () => {
            Alert.alert('Renewed', 'Placement rolled into new period. Renewal alert cleared.');
          }
        }
      ]
    );
  };

  const handleClose = (item) => {
    Alert.alert(
      'Close Service',
      `Close service for ${item.client}? Reasons: Contract ended, Patient recovered, Hospitalized. Frees caregiver immediately while keeping ledger intact.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Service',
          style: 'destructive',
          onPress: () => {
            setPlacements(prev => prev.filter(p => p.id !== item.id));
            Alert.alert('Closed', 'Service closed. Caregiver returned to free pool.');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView edges={['top']} style={ui.safeContainer}>
      <View style={ui.screen}>
        {/* Header */}
        <View style={ui.headerWithAction}>
          <View style={{ flex: 1 }}>
            <Text style={ui.pageTitle}>Placements</Text>
            <Text style={ui.pageSub}>Shifts, agency margins & renewals</Text>
          </View>
          <TouchableOpacity
            style={ui.primaryAddBtn}
            onPress={() => { setStep(1); setCreateModal(true); }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={ui.primaryAddBtnText}>+ New Placement</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={placements}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          renderItem={({ item }) => (
            <View style={ui.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={ui.cardTitle}>{item.client}</Text>
                  <Text style={ui.cardSub}>Caregiver: <Text style={{ fontWeight: '700', color: '#1e293b' }}>{item.caregiver}</Text> • {item.shift}</Text>
                </View>
                <StatusPill label={item.status} />
              </View>

              {/* Financial Margin Display */}
              <View style={ui.marginBox}>
                <View>
                  <Text style={ui.marginSub}>CLIENT PAYS</Text>
                  <Text style={ui.marginVal}>₹{item.clientPay.toLocaleString('en-IN')}</Text>
                </View>
                <View>
                  <Text style={ui.marginSub}>CAREGIVER GETS</Text>
                  <Text style={ui.marginVal}>₹{item.cgGet.toLocaleString('en-IN')}</Text>
                </View>
                <View>
                  <Text style={[ui.marginSub, { color: '#15803d' }]}>AGENCY MARGIN</Text>
                  <Text style={[ui.marginVal, { color: '#15803d' }]}>
                    ₹{item.margin.toLocaleString('en-IN')} ({item.marginPct}%)
                  </Text>
                </View>
              </View>

              {/* Lifecycle Actions */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <TouchableOpacity style={ui.actionPill} onPress={() => handleReplace(item)} activeOpacity={0.7}>
                  <Text style={ui.actionPillText}>🔄 Replace</Text>
                </TouchableOpacity>
                <TouchableOpacity style={ui.actionPill} onPress={() => handleRemove(item)} activeOpacity={0.7}>
                  <Text style={ui.actionPillText}>❌ Remove</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[ui.actionPill, { borderColor: '#d97706', backgroundColor: '#fffbeb' }]} onPress={() => handleRenew(item)} activeOpacity={0.7}>
                  <Text style={[ui.actionPillText, { color: '#b45309' }]}>🔁 Renew</Text>
                </TouchableOpacity>
                <TouchableOpacity style={ui.actionPill} onPress={() => handleClose(item)} activeOpacity={0.7}>
                  <Text style={ui.actionPillText}>🔒 Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        {/* Modal: Placement Wizard */}
        <Modal visible={createModal} transparent animationType="slide">
          <View style={ui.modalOverlay}>
            <View style={ui.modalCard}>
              <Text style={ui.modalTitle}>New Placement (Step {step}/3)</Text>

              {step === 1 && (
                <View>
                  <Text style={ui.modalSub}>Select client and matching caregiver:</Text>
                  <Text style={ui.fieldLabel}>Client</Text>
                  <View style={ui.pickerOption}>
                    <Text style={ui.pickerOptionTitle}>Priya Nair</Text>
                    <Text style={ui.pickerOptionSub}>Banjara Hills • Bedridden Care</Text>
                  </View>

                  <Text style={[ui.fieldLabel, { marginTop: 12 }]}>Available Free Caregiver</Text>
                  <View style={ui.pickerOption}>
                    <Text style={ui.pickerOptionTitle}>Rekha Sharma (Free)</Text>
                    <Text style={ui.pickerOptionSub}>3 yrs exp • ₹18,000/mo expected</Text>
                  </View>

                  <TouchableOpacity style={ui.submitBtn} onPress={() => setStep(2)} activeOpacity={0.7}>
                    <Text style={ui.submitBtnText}>Continue to Rates & Shift →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {step === 2 && (
                <View>
                  <Text style={ui.modalSub}>Set shift schedule:</Text>
                  <Text style={ui.fieldLabel}>Shift Pattern</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
                    {['12h day', '12h night', '24h live-in'].map(s => (
                      <TouchableOpacity
                        key={s}
                        style={[ui.roleSelectPill, shiftType === s && ui.roleSelectPillActive]}
                        onPress={() => setShiftType(s)}
                        activeOpacity={0.7}
                      >
                        <Text style={[ui.roleSelectText, shiftType === s && ui.roleSelectTextActive]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity style={ui.submitBtn} onPress={() => setStep(3)} activeOpacity={0.7}>
                    <Text style={ui.submitBtnText}>Calculate Live Margin →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {step === 3 && (
                <View>
                  <Text style={ui.modalSub}>Configure client pricing and caregiver pay:</Text>

                  <Text style={ui.fieldLabel}>What Client Pays (₹/month)</Text>
                  <TextInput
                    style={ui.fieldInput}
                    keyboardType="numeric"
                    value={clientRate}
                    onChangeText={setClientRate}
                    placeholderTextColor="#94a3b8"
                  />

                  <Text style={ui.fieldLabel}>What Caregiver Gets (₹/month)</Text>
                  <TextInput
                    style={ui.fieldInput}
                    keyboardType="numeric"
                    value={caregiverRate}
                    onChangeText={setCaregiverRate}
                    placeholderTextColor="#94a3b8"
                  />

                  {/* Live Margin Card */}
                  <View style={[ui.marginBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1 }]}>
                    <View>
                      <Text style={[ui.marginSub, { color: '#166534' }]}>YOUR MARGIN</Text>
                      <Text style={[ui.marginVal, { color: '#15803d', fontSize: 18 }]}>
                        ₹{liveMargin.toLocaleString('en-IN')} /mo
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[ui.marginSub, { color: '#166534' }]}>MARGIN %</Text>
                      <Text style={[ui.marginVal, { color: '#15803d', fontSize: 18 }]}>{marginPct}%</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={ui.submitBtn} onPress={handleFinishPlacement} activeOpacity={0.7}>
                    <Text style={ui.submitBtnText}>Confirm Placement & Bill Client</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={ui.cancelBtn} onPress={() => setCreateModal(false)} activeOpacity={0.7}>
                <Text style={ui.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

// ── TAB 5: MONEY & LEDGER ────────────────────────────────────────────────────
const MoneyTab = () => {
  const [subTab, setSubTab] = useState('To collect');
  const [recordModal, setRecordModal] = useState(false);
  const [selectedCollect, setSelectedCollect] = useState(null);
  const [payMethod, setPayMethod] = useState('UPI');

  const [toCollect, setToCollect] = useState([
    { id: '1', client: 'Ramesh Sharma', amount: 23600, due: 'Due in 2 days', overdue: false },
    { id: '2', client: 'Kamala Gupta', amount: 18000, due: 'Due in 15 days', overdue: false },
  ]);

  const [toPay, setToPay] = useState([
    { id: '1', caregiver: 'Meena Kumari', workedDays: 22, rate: 500, amount: 11000, advance: 0 },
    { id: '2', caregiver: 'Anita Yadav', workedDays: 20, rate: 500, amount: 7000, advance: 3000 },
  ]);

  const handleOpenRecord = (item) => {
    setSelectedCollect(item);
    setRecordModal(true);
  };

  const handleConfirmCollection = () => {
    if (!selectedCollect) return;
    setToCollect(prev => prev.filter(c => c.id !== selectedCollect.id));
    setRecordModal(false);
    Alert.alert(
      'Payment Recorded!',
      `₹${selectedCollect.amount.toLocaleString('en-IN')} confirmed via ${payMethod}.\nClient ledger updated. Statement ready for sharing.`
    );
  };

  const handlePayCaregiver = (cg) => {
    Alert.alert(
      'Pay Caregiver',
      `Pay ₹${cg.amount.toLocaleString('en-IN')} to ${cg.caregiver} for ${cg.workedDays} days worked?\n(Calculated from daily verified attendance).`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark as Advance', onPress: () => Alert.alert('Recorded', 'Advance payment recorded in ledger.') },
        {
          text: 'Confirm Payout',
          onPress: () => {
            setToPay(prev => prev.filter(p => p.id !== cg.id));
            Alert.alert('Success', `Salary payout of ₹${cg.amount.toLocaleString('en-IN')} confirmed.`);
          }
        }
      ]
    );
  };

  const shareStatement = () => {
    Share.share({
      message: `*Florence Nightingales - Account Statement*\nClient: Ramesh Sharma\nPeriod: Current Billing Cycle\n------------------------\nTotal Billed: ₹30,000\nAbsence Credit: -₹1,000 (1 day)\nPayment Received: ₹10,000 (UPI)\n------------------------\nNet Balance Due: ₹19,000\nPay via UPI: billing@florence.com\nFlorence Nightingales Home Care Services`
    });
  };

  return (
    <SafeAreaView edges={['top']} style={ui.safeContainer}>
      <View style={ui.screen}>
        {/* Header */}
        <View style={ui.headerWithAction}>
          <View>
            <Text style={ui.pageTitle}>Money & Ledger</Text>
            <Text style={ui.pageSub}>Receivables, payouts & financial ledger</Text>
          </View>
        </View>

        {/* 3 Sub-tabs */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <View style={ui.segmentTrack}>
            {['To collect', 'To pay', 'Client Ledger'].map(t => (
              <TouchableOpacity
                key={t}
                style={[ui.segmentBtn, subTab === t && ui.segmentBtnActive]}
                onPress={() => setSubTab(t)}
                activeOpacity={0.7}
              >
                <Text style={[ui.segmentText, subTab === t && ui.segmentTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {subTab === 'To collect' && (
          <ScrollView style={{ paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={ui.moneySummaryBox}>
              <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '700' }}>TOTAL TO COLLECT</Text>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#0f172a', marginTop: 2 }}>₹41,600</Text>
            </View>

            {toCollect.map(item => (
              <View key={item.id} style={ui.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={ui.cardTitle}>{item.client}</Text>
                    <Text style={[ui.cardSub, item.overdue && { color: '#b91c1c', fontWeight: '800' }]}>
                      {item.overdue ? `🚨 ${item.due}` : item.due}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: item.overdue ? '#b91c1c' : '#0f172a' }}>
                      ₹{item.amount.toLocaleString('en-IN')}
                    </Text>
                    <TouchableOpacity
                      style={ui.recordBtn}
                      onPress={() => handleOpenRecord(item)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={ui.recordBtnText}>Record Payment</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {subTab === 'To pay' && (
          <ScrollView style={{ paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={[ui.moneySummaryBox, { backgroundColor: '#fefce8', borderColor: '#fef08a' }]}>
              <Text style={{ fontSize: 13, color: '#854d0e', fontWeight: '700' }}>TOTAL TO PAY CAREGIVERS</Text>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#a16207', marginTop: 2 }}>₹18,000</Text>
            </View>

            {toPay.map(item => (
              <View key={item.id} style={ui.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={ui.cardTitle}>{item.caregiver}</Text>
                    <Text style={ui.cardSub}>{item.workedDays} days worked • ₹{item.rate}/day</Text>
                    {item.advance > 0 && (
                      <Text style={[ui.cardSub, { color: '#b45309', fontWeight: '700' }]}>
                        Advance paid: ₹{item.advance.toLocaleString('en-IN')}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>
                      ₹{item.amount.toLocaleString('en-IN')}
                    </Text>
                    <TouchableOpacity
                      style={[ui.recordBtn, { backgroundColor: '#15803d' }]}
                      onPress={() => handlePayCaregiver(item)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={ui.recordBtnText}>Pay Caregiver</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {subTab === 'Client Ledger' && (
          <ScrollView style={{ paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>Ramesh Sharma</Text>
                <Text style={{ fontSize: 12, color: '#64748b' }}>Complete Statement • June-July</Text>
              </View>
              <TouchableOpacity
                style={ui.shareBtn}
                onPress={shareStatement}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={ui.shareBtnText}>📤 Share Statement</Text>
              </TouchableOpacity>
            </View>

            <View style={[ui.card, { padding: 12 }]}>
              <View style={ui.ledgerRow}>
                <Text style={ui.ledgerDate}>01 Jun</Text>
                <Text style={ui.ledgerDesc}>Invoice #1042 - 30 days care</Text>
                <Text style={ui.ledgerAmount}>+ ₹30,000</Text>
              </View>
              <View style={ui.ledgerRow}>
                <Text style={ui.ledgerDate}>10 Jun</Text>
                <Text style={[ui.ledgerDesc, { color: '#b91c1c' }]}>Absence credit (1 day)</Text>
                <Text style={[ui.ledgerAmount, { color: '#b91c1c' }]}>- ₹1,000</Text>
              </View>
              <View style={ui.ledgerRow}>
                <Text style={ui.ledgerDate}>15 Jun</Text>
                <Text style={[ui.ledgerDesc, { color: '#15803d' }]}>Payment via UPI (Ref #9822)</Text>
                <Text style={[ui.ledgerAmount, { color: '#15803d' }]}>- ₹10,000</Text>
              </View>
              <View style={[ui.ledgerRow, { borderBottomWidth: 0, paddingTop: 12, marginTop: 4 }]}>
                <Text style={[ui.ledgerDesc, { fontWeight: '800', color: '#0f172a' }]}>Current Balance Due</Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>₹19,000</Text>
              </View>
            </View>
          </ScrollView>
        )}

        {/* Modal: Record Client Payment */}
        <Modal visible={recordModal} transparent animationType="slide">
          <View style={ui.modalOverlay}>
            <View style={ui.modalCard}>
              <Text style={ui.modalTitle}>Record Collection</Text>
              <Text style={ui.modalSub}>Client: {selectedCollect?.client}</Text>

              <Text style={ui.fieldLabel}>Amount Received (₹)</Text>
              <TextInput
                style={ui.fieldInput}
                keyboardType="numeric"
                defaultValue={selectedCollect?.amount?.toString()}
                placeholderTextColor="#94a3b8"
              />

              <Text style={ui.fieldLabel}>Payment Mode</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {['UPI', 'Bank Transfer', 'Cash', 'Cheque'].map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[ui.roleSelectPill, payMethod === m && ui.roleSelectPillActive]}
                    onPress={() => setPayMethod(m)}
                    activeOpacity={0.7}
                  >
                    <Text style={[ui.roleSelectText, payMethod === m && ui.roleSelectTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={ui.submitBtn} onPress={handleConfirmCollection} activeOpacity={0.7}>
                <Text style={ui.submitBtnText}>Confirm Collection</Text>
              </TouchableOpacity>

              <TouchableOpacity style={ui.cancelBtn} onPress={() => setRecordModal(false)} activeOpacity={0.7}>
                <Text style={ui.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

// ── ROOT FLORENCE NIGHTINGALES TAB NAVIGATOR ─────────────────────────────────
export default function FlorenceNightingalesDashboard({ token, onLogout }) {
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
            Today: '📅',
            Caregivers: '👥',
            Clients: '🤝',
            Placements: '📋',
            Money: '💰'
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
      <Tab.Screen name="Today">
        {(props) => <TodayTab {...props} onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Caregivers" component={CaregiversTab} />
      <Tab.Screen name="Clients" component={ClientsTab} />
      <Tab.Screen name="Placements" component={PlacementsTab} />
      <Tab.Screen name="Money" component={MoneyTab} />
    </Tab.Navigator>
  );
}

// ── FLORENCE NIGHTINGALES DESIGN SYSTEM STYLES ────────────────────────────────
const ui = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  agencyTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  agencySub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  signoutBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  signoutText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b91c1c',
  },

  headerWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  pageSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  primaryAddBtn: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 2,
  },
  primaryAddBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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

  datePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  datePillActive: {
    backgroundColor: '#1e3a8a',
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  datePillTextActive: {
    color: '#ffffff',
  },

  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  badgeMuted: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },

  alertCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400e',
  },
  alertSub: {
    fontSize: 12,
    color: '#b45309',
    marginTop: 1,
  },
  alertActionBtn: {
    backgroundColor: '#d97706',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  alertActionText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
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
  roleTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e3a8a',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  checkBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#86efac',
  },
  checkBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803d',
  },
  crossBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
  },
  crossBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#b91c1c',
  },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
  },

  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  filterPillActive: {
    backgroundColor: '#1e3a8a',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },

  skillTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skillText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },

  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  segmentTextActive: {
    color: '#0f172a',
  },

  tagUrgent: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagUrgentText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b91c1c',
  },
  convertBtn: {
    marginTop: 10,
    backgroundColor: '#1e3a8a',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  convertBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  marginBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  marginSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  marginVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },

  actionPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },

  moneySummaryBox: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  recordBtn: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 6,
  },
  recordBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },

  shareBtn: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  shareBtnText: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '800',
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  ledgerDate: {
    fontSize: 11,
    color: '#94a3b8',
    width: 70,
  },
  ledgerDesc: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
  },
  ledgerAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
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
  optionCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  optionSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
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
  roleSelectPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  roleSelectPillActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  roleSelectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  roleSelectTextActive: {
    color: '#ffffff',
  },
  submitBtn: {
    backgroundColor: '#1e3a8a',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
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
  prefillNotice: {
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  pickerOption: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  pickerOptionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  pickerOptionSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});
