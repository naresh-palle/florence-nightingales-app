import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator, Image, Share
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();
const API = 'https://florence-nightingales-app.onrender.com';

// ── SHARED STYLES & COMPONENTS ───────────────────────────────────────────────
const StatusPill = ({ label, type }) => {
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
    { id: '1', caregiver: 'Meena Kumari', role: 'Nurse', client: 'Ramesh Sharma', shift: '12h day', status: 'UNMARKED' },
    { id: '2', caregiver: 'Anita Yadav', role: 'Caregiver', client: 'Ramesh Sharma', shift: '12h night', status: 'UNMARKED' },
    { id: '3', caregiver: 'Lakshmi Nair', role: 'Caregiver', client: 'Kamala Gupta', shift: 'Live-in', status: 'UNMARKED' },
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
    <ScrollView style={ui.screen}>
      {/* Agency Header */}
      <View style={ui.topHeader}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={ui.agencyTitle}>Sunrise Home Care</Text>
            <Text style={ui.agencySub}>Operational Dashboard • Mon, 7 Jul 2026</Text>
          </View>
          {onLogout && (
            <TouchableOpacity onPress={onLogout} style={ui.signoutBtn}>
              <Text style={ui.signoutText}>Sign Out</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 4 Summary Cards */}
        <View style={ui.statsRow}>
          <View style={ui.statBox}>
            <Text style={ui.statLabel}>ACTIVE CLIENTS</Text>
            <Text style={ui.statValue}>3</Text>
          </View>
          <View style={ui.statBox}>
            <Text style={ui.statLabel}>ACTIVE CAREGIVERS</Text>
            <Text style={ui.statValue}>3</Text>
          </View>
        </View>
        <View style={[ui.statsRow, { marginTop: 8 }]}>
          <TouchableOpacity style={[ui.statBox, { backgroundColor: '#f0fdf4' }]} onPress={() => navigation.navigate('Money')}>
            <Text style={[ui.statLabel, { color: '#166534' }]}>TO COLLECT</Text>
            <Text style={[ui.statValue, { color: '#15803d' }]}>₹41,600</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[ui.statBox, { backgroundColor: '#fefce8' }]} onPress={() => navigation.navigate('Money')}>
            <Text style={[ui.statLabel, { color: '#854d0e' }]}>TO PAY</Text>
            <Text style={[ui.statValue, { color: '#a16207' }]}>₹14,000</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Switcher */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {['Today', 'Yesterday', '5 Jul', '4 Jul', '3 Jul'].map(d => (
            <TouchableOpacity
              key={d}
              style={[ui.datePill, selectedDate === d && ui.datePillActive]}
              onPress={() => setSelectedDate(d)}
            >
              <Text style={[ui.datePillText, selectedDate === d && ui.datePillTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Alerts Section (Workflow 8 & Enquiries) */}
      <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
        <Text style={ui.sectionHeader}>Alerts</Text>
        <View style={ui.alertCard}>
          <View style={{ flex: 1 }}>
            <Text style={ui.alertTitle}>⚠️ Sharma family renewal</Text>
            <Text style={ui.alertSub}>Due in 2 days • ₹24,000</Text>
          </View>
          <TouchableOpacity style={ui.alertActionBtn} onPress={() => navigation.navigate('Placements')}>
            <Text style={ui.alertActionText}>Renew</Text>
          </TouchableOpacity>
        </View>
        <View style={[ui.alertCard, { marginTop: 8, borderColor: '#bae6fd', backgroundColor: '#f0f9ff' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[ui.alertTitle, { color: '#0369a1' }]}>📞 2 enquiries open</Text>
            <Text style={[ui.alertSub, { color: '#0284c7' }]}>Waiting more than 2 days for follow-up</Text>
          </View>
          <TouchableOpacity style={[ui.alertActionBtn, { backgroundColor: '#0284c7' }]} onPress={() => navigation.navigate('Clients')}>
            <Text style={ui.alertActionText}>View</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Daily Attendance List (Workflow 5) */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={ui.sectionHeader}>Attendance List</Text>
          <Text style={ui.badgeMuted}>3 assigned</Text>
        </View>

        {attendanceList.map(item => (
          <View key={item.id} style={ui.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={ui.cardTitle}>{item.caregiver}</Text>
                <Text style={ui.cardSub}>With: <Text style={{ fontWeight: '700', color: '#1e293b' }}>{item.client}</Text> • {item.shift}</Text>
              </View>
              {item.status !== 'UNMARKED' ? (
                <StatusPill label={item.status.includes('Present') ? 'Present' : 'Absent'} />
              ) : (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity style={ui.checkBtn} onPress={() => markPresent(item.id)}>
                    <Text style={ui.checkBtnText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={ui.crossBtn} onPress={() => openAbsentModal(item)}>
                    <Text style={ui.crossBtnText}>✗</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Absent Billing Decision Modal */}
      <Modal visible={absentModalVisible} transparent animationType="slide">
        <View style={ui.modalOverlay}>
          <View style={ui.modalCard}>
            <Text style={ui.modalTitle}>Marking Absent</Text>
            <Text style={ui.modalSub}>Choose how this absence is billed right at the moment it's marked:</Text>

            <TouchableOpacity style={ui.optionCard} onPress={() => confirmAbsent('DEDUCT')}>
              <Text style={ui.optionTitle}>✓ Deduct from bill (Recommended)</Text>
              <Text style={ui.optionSub}>Default rule: The unserved day comes off the client's charge automatically.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[ui.optionCard, { marginTop: 10 }]} onPress={() => confirmAbsent('PAID')}>
              <Text style={ui.optionTitle}>✓ Paid absence</Text>
              <Text style={ui.optionSub}>Client agreed to pay anyway. Caregiver gets paid, no deduction.</Text>
            </TouchableOpacity>

            <TouchableOpacity style={ui.cancelBtn} onPress={() => setAbsentModalVisible(false)}>
              <Text style={ui.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// ── TAB 2: CAREGIVERS (WORKFLOW 1) ───────────────────────────────────────────
const CaregiversTab = () => {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [caregivers, setCaregivers] = useState([
    { id: '1', name: 'Rekha Sharma', phone: '98191 22334', role: 'Caregiver', status: 'Free', exp: '3 yrs', rate: '₹18,000/mo', skills: ['Elderly Care', 'Cooking'], languages: ['Hindi'] },
    { id: '2', name: 'Meena Kumari', phone: '98221 44556', role: 'Nurse', status: 'Placed', client: 'Ramesh Sharma', exp: '5 yrs', rate: '₹22,000/mo', skills: ['Critical Care', 'Vitals'], languages: ['Hindi', 'English'] },
    { id: '3', name: 'Sunita Devi', phone: '98334 55667', role: 'Caregiver', status: 'Free', exp: '2 yrs', rate: '₹16,000/mo', skills: ['Elderly Care', 'Bedridden'], languages: ['Hindi'] },
    { id: '4', name: 'Anita Yadav', phone: '98445 66778', role: 'Nurse', status: 'Placed', client: 'Ramesh Sharma', exp: '4 yrs', rate: '₹20,000/mo', skills: ['ICU', 'Post-Surgery'], languages: ['Hindi', 'Telugu'] },
    { id: '5', name: 'Farah Khan', phone: '98556 77889', role: 'Semi-nurse', status: 'Free', exp: '1 yr', rate: '₹15,000/mo', skills: ['Baby Care', 'Cooking'], languages: ['Hindi', 'English'] },
  ]);

  // Form states
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
      skills: ['Elderly Care', 'Assistance'],
      languages: ['Hindi']
    };
    setCaregivers([newEntry, ...caregivers]);
    setAddModal(false);
    setNewName('');
    setNewPhone('');
    Alert.alert('Saved', `${newName} shows up as Free, ready to be placed.`);
  };

  return (
    <View style={ui.screen}>
      <View style={ui.headerWithAction}>
        <View>
          <Text style={ui.pageTitle}>Caregivers</Text>
          <Text style={ui.pageSub}>Manage & match care staffing</Text>
        </View>
        <TouchableOpacity style={ui.primaryAddBtn} onPress={() => setAddModal(true)}>
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

      {/* Filters (Placed, Free, On leave) */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {['All', 'Placed', 'Free', 'On leave'].map(f => (
            <TouchableOpacity
              key={f}
              style={[ui.filterPill, filter === f && ui.filterPillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[ui.filterPillText, filter === f && ui.filterPillTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={ui.card} onPress={() => Alert.alert('Caregiver Profile', `${item.name} (${item.role})\nPhone: ${item.phone}\nExpected Rate: ${item.rate}\nExperience: ${item.exp}\nSkills: ${item.skills.join(', ')}`)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={ui.cardTitle}>{item.name}</Text>
                  <Text style={ui.roleTag}>{item.role}</Text>
                </View>
                <Text style={ui.cardSub}>📞 {item.phone} • {item.exp} exp</Text>
                {item.client && <Text style={{ fontSize: 12, color: '#166534', marginTop: 2 }}>Placed with: {item.client}</Text>}
              </View>
              <StatusPill label={item.status} />
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {item.skills.map((s, idx) => (
                <View key={idx} style={ui.skillTag}><Text style={ui.skillText}>{s}</Text></View>
              ))}
            </View>
            <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: '#64748b' }}>Expected: <Text style={{ fontWeight: '700', color: '#0f172a' }}>{item.rate}</Text></Text>
              <Text style={{ fontSize: 12, color: '#0369a1' }}>Tap for full details →</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Add Caregiver Modal (Step 1 & 2 of Workflow 1) */}
      <Modal visible={addModal} transparent animationType="slide">
        <View style={ui.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={ui.modalCard}>
              <Text style={ui.modalTitle}>Add Caregiver</Text>
              <Text style={ui.modalSub}>Photo, name, and phone first — essentials to get started.</Text>

              <Text style={ui.fieldLabel}>Full Name *</Text>
              <TextInput style={ui.fieldInput} placeholder="e.g. Rekha Sharma" value={newName} onChangeText={setNewName} />

              <Text style={ui.fieldLabel}>Phone Number *</Text>
              <TextInput style={ui.fieldInput} placeholder="e.g. 98191 44332" keyboardType="phone-pad" value={newPhone} onChangeText={setNewPhone} />

              <Text style={ui.fieldLabel}>Role</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {['Caregiver', 'Nurse', 'Semi-nurse'].map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[ui.roleSelectPill, newRole === r && ui.roleSelectPillActive]}
                    onPress={() => setNewRole(r)}
                  >
                    <Text style={[ui.roleSelectText, newRole === r && ui.roleSelectTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={ui.fieldLabel}>Total Experience (Years)</Text>
              <TextInput style={ui.fieldInput} placeholder="e.g. 3" keyboardType="numeric" value={newExp} onChangeText={setNewExp} />

              <Text style={ui.fieldLabel}>Fixed Monthly Expected Rate (₹)</Text>
              <TextInput style={ui.fieldInput} placeholder="e.g. 18000" keyboardType="numeric" value={newRate} onChangeText={setNewRate} />

              <TouchableOpacity style={ui.submitBtn} onPress={handleAddCaregiver}>
                <Text style={ui.submitBtnText}>Save Caregiver</Text>
              </TouchableOpacity>

              <TouchableOpacity style={ui.cancelBtn} onPress={() => setAddModal(false)}>
                <Text style={ui.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

// ── TAB 3: CLIENTS & ENQUIRIES (WORKFLOW 2) ──────────────────────────────────
const ClientsTab = () => {
  const [segment, setSegment] = useState('Enquiries');
  const [convertModal, setConvertModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // Form states for conversion
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('72');
  const [conditions, setConditions] = useState('Bedridden, 24h care required');
  const [familyRelation, setFamilyRelation] = useState('Daughter');

  const [enquiries, setEnquiries] = useState([
    { id: '1', name: 'Priya Nair', phone: '98191 44332', need: 'Bedridden, 24h Live-in', area: 'Andheri West', urgency: 'Immediate', budget: '₹28,000/mo' },
    { id: '2', name: 'Rahul Mehta', phone: '98223 11223', need: 'Elder care, 12h day', area: 'Malad West', urgency: 'Next week', budget: '₹18,000/mo' },
  ]);

  const [clients, setClients] = useState([
    { id: '1', name: 'Ramesh Sharma', phone: '98765 43210', area: 'Banjara Hills', caregiversCount: 1, caregiverName: 'Meena Kumari', dues: '₹23,600' },
    { id: '2', name: 'Kamala Gupta', phone: '98123 45678', area: 'Jubilee Hills', caregiversCount: 1, caregiverName: 'Lakshmi Nair', dues: '₹0 (Paid)' },
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
      caregiverName: 'Unassigned (Ready to place)',
      dues: '₹0'
    };
    setClients([newClient, ...clients]);
    setEnquiries(enquiries.filter(e => e.id !== selectedEnquiry.id));
    setConvertModal(false);
    setSegment('Clients');
    Alert.alert('She is now a client!', 'No re-typing, no lost history. The enquiry closed automatically. Now she just needs a caregiver placed.');
  };

  return (
    <View style={ui.screen}>
      <View style={ui.headerWithAction}>
        <View>
          <Text style={ui.pageTitle}>Clients & Leads</Text>
          <Text style={ui.pageSub}>From first phone call to continuous care</Text>
        </View>
      </View>

      {/* Segment Switcher */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <View style={ui.segmentTrack}>
          <TouchableOpacity
            style={[ui.segmentBtn, segment === 'Enquiries' && ui.segmentBtnActive]}
            onPress={() => setSegment('Enquiries')}
          >
            <Text style={[ui.segmentText, segment === 'Enquiries' && ui.segmentTextActive]}>📞 Enquiries ({enquiries.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[ui.segmentBtn, segment === 'Clients' && ui.segmentBtnActive]}
            onPress={() => setSegment('Clients')}
          >
            <Text style={[ui.segmentText, segment === 'Clients' && ui.segmentTextActive]}>🤝 Clients ({clients.length})</Text>
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

              <TouchableOpacity style={ui.convertBtn} onPress={() => openConvert(item)}>
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
                  <Text style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>
                    Caregivers placed: <Text style={{ fontWeight: '700' }}>{item.caregiversCount}</Text> ({item.caregiverName})
                  </Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '800', color: item.dues.includes('0') ? '#15803d' : '#b91c1c' }}>
                  {item.dues}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      {/* Convert Enquiry to Client Modal */}
      <Modal visible={convertModal} transparent animationType="slide">
        <View style={ui.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={ui.modalCard}>
              <Text style={ui.modalTitle}>New Client from Enquiry</Text>
              <Text style={ui.modalSub}>Everything carries over. Add patient details & family contacts.</Text>

              <View style={ui.prefillNotice}>
                <Text style={{ fontSize: 12, color: '#15803d', fontWeight: '700' }}>✓ Prefilled from {selectedEnquiry?.name}</Text>
                <Text style={{ fontSize: 12, color: '#166534' }}>{selectedEnquiry?.phone} • {selectedEnquiry?.need}</Text>
              </View>

              <Text style={ui.fieldLabel}>Patient Name *</Text>
              <TextInput style={ui.fieldInput} value={patientName} onChangeText={setPatientName} />

              <Text style={ui.fieldLabel}>Patient Age</Text>
              <TextInput style={ui.fieldInput} keyboardType="numeric" value={patientAge} onChangeText={setPatientAge} />

              <Text style={ui.fieldLabel}>Conditions / Care Notes</Text>
              <TextInput style={ui.fieldInput} value={conditions} onChangeText={setConditions} />

              <Text style={ui.fieldLabel}>Family Contact Relation</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                {['Daughter', 'Son', 'Spouse', 'Sibling', 'Other'].map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[ui.roleSelectPill, familyRelation === r && ui.roleSelectPillActive]}
                    onPress={() => setFamilyRelation(r)}
                  >
                    <Text style={[ui.roleSelectText, familyRelation === r && ui.roleSelectTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={ui.submitBtn} onPress={handleConvert}>
                <Text style={ui.submitBtnText}>Confirm & Convert to Client</Text>
              </TouchableOpacity>

              <TouchableOpacity style={ui.cancelBtn} onPress={() => setConvertModal(false)}>
                <Text style={ui.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

// ── TAB 4: PLACEMENTS (WORKFLOWS 3, 4, 8, 9) ──────────────────────────────────
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
    { id: '2', client: 'Kamala Gupta', caregiver: 'Lakshmi Nair', shift: 'Live-in', clientPay: 35000, cgGet: 25000, margin: 10000, marginPct: 29, status: 'Active' },
  ]);

  const handleFinishPlacement = () => {
    const newP = {
      id: Date.now().toString(),
      client: 'Priya Nair',
      caregiver: 'Sunita Devi',
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
    Alert.alert('Confirmed!', 'Caregiver is placed and the first invoice of ₹' + Number(clientRate).toLocaleString('en-IN') + ' went out automatically.');
  };

  const handleReplace = (item) => {
    Alert.alert(
      'Replace Caregiver',
      `Pick who is taking over from ${item.caregiver}. Only free caregivers appear. The old caregiver becomes free immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Swap with Rekha Sharma', onPress: () => {
          setPlacements(prev => prev.map(p => p.id === item.id ? { ...p, caregiver: 'Rekha Sharma' } : p));
          Alert.alert('Swapped', 'Rekha Sharma placed. Previous caregiver freed.');
        }}
      ]
    );
  };

  const handleRemove = (item) => {
    Alert.alert(
      'Remove Caregiver',
      `No replacement yet? Remove and client bill adjusts itself based on daily rate.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove & Pro-rate Credit', style: 'destructive', onPress: () => {
          setPlacements(prev => prev.filter(p => p.id !== item.id));
          Alert.alert('Removed', 'Caregiver freed. 4 days unserved credited back to client ledger (-₹4,000).');
        }}
      ]
    );
  };

  const handleRenew = (item) => {
    Alert.alert(
      'Renew Placement',
      `Roll placement for ${item.client} into next 30-day billing cycle?\nClient pays: ₹${item.clientPay}\nCaregiver gets: ₹${item.cgGet}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm Renewal & Send Invoice', onPress: () => {
          Alert.alert('Renewed', 'Placement rolled into new period. Renewal alert cleared.');
        }}
      ]
    );
  };

  const handleClose = (item) => {
    Alert.alert(
      'Close Service',
      `Close service for ${item.client}? Reasons: Contract ended, Recovered, Hospitalized. Frees caregiver immediately while keeping ledger history intact.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Close Service', style: 'destructive', onPress: () => {
          setPlacements(prev => prev.filter(p => p.id !== item.id));
          Alert.alert('Closed', 'Service closed. Caregivers freed.');
        }}
      ]
    );
  };

  return (
    <View style={ui.screen}>
      <View style={ui.headerWithAction}>
        <View>
          <Text style={ui.pageTitle}>Placements</Text>
          <Text style={ui.pageSub}>Shifts, agency margins & renewals</Text>
        </View>
        <TouchableOpacity style={ui.primaryAddBtn} onPress={() => { setStep(1); setCreateModal(true); }}>
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

            {/* Live Margin Calculation Card */}
            <View style={ui.marginBox}>
              <View>
                <Text style={ui.marginSub}>Client pays</Text>
                <Text style={ui.marginVal}>₹{item.clientPay.toLocaleString('en-IN')}</Text>
              </View>
              <View>
                <Text style={ui.marginSub}>Caregiver gets</Text>
                <Text style={ui.marginVal}>₹{item.cgGet.toLocaleString('en-IN')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[ui.marginSub, { color: '#15803d' }]}>Agency Margin</Text>
                <Text style={[ui.marginVal, { color: '#15803d' }]}>₹{item.margin.toLocaleString('en-IN')} ({item.marginPct}%)</Text>
              </View>
            </View>

            {/* 4 Action Buttons from PDF Workflows 4, 8, 9 */}
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              <TouchableOpacity style={ui.actionPill} onPress={() => handleReplace(item)}>
                <Text style={ui.actionPillText}>🔄 Replace</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ui.actionPill} onPress={() => handleRemove(item)}>
                <Text style={ui.actionPillText}>❌ Remove</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ui.actionPill} onPress={() => handleRenew(item)}>
                <Text style={ui.actionPillText}>🔁 Renew</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[ui.actionPill, { borderColor: '#fee2e2' }]} onPress={() => handleClose(item)}>
                <Text style={[ui.actionPillText, { color: '#b91c1c' }]}>🛑 Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Create Placement 3-Step Wizard Modal (Workflow 3) */}
      <Modal visible={createModal} transparent animationType="slide">
        <View style={ui.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={ui.modalCard}>
              <Text style={ui.modalTitle}>New Placement (Step {step} of 3)</Text>
              
              {step === 1 && (
                <>
                  <Text style={ui.modalSub}>Pick the client. Client card shows how many caregivers they have.</Text>
                  <TouchableOpacity style={ui.pickerOption} onPress={() => setStep(2)}>
                    <Text style={ui.pickerOptionTitle}>Priya Nair</Text>
                    <Text style={ui.pickerOptionSub}>Andheri West • 0 caregivers placed</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[ui.pickerOption, { marginTop: 8 }]} onPress={() => setStep(2)}>
                    <Text style={ui.pickerOptionTitle}>Ramesh Sharma</Text>
                    <Text style={ui.pickerOptionSub}>Banjara Hills • 1 caregiver placed</Text>
                  </TouchableOpacity>
                </>
              )}

              {step === 2 && (
                <>
                  <Text style={ui.modalSub}>Pick a free caregiver. Only caregivers marked Free show up here.</Text>
                  <TouchableOpacity style={ui.pickerOption} onPress={() => setStep(3)}>
                    <Text style={ui.pickerOptionTitle}>Sunita Devi</Text>
                    <Text style={ui.pickerOptionSub}>Caregiver • Elderly Care, Bedridden • ₹16,000/mo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[ui.pickerOption, { marginTop: 8 }]} onPress={() => setStep(3)}>
                    <Text style={ui.pickerOptionTitle}>Rekha Sharma</Text>
                    <Text style={ui.pickerOptionSub}>Caregiver • Elderly Care, Cooking • ₹18,000/mo</Text>
                  </TouchableOpacity>
                </>
              )}

              {step === 3 && (
                <>
                  <Text style={ui.modalSub}>Set shift, what client pays, what caregiver gets. Agency margin is shown live.</Text>

                  <Text style={ui.fieldLabel}>Shift Type</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                    {['12h day', '12h night', 'Live-in', 'Custom'].map(s => (
                      <TouchableOpacity key={s} style={[ui.roleSelectPill, shiftType === s && ui.roleSelectPillActive]} onPress={() => setShiftType(s)}>
                        <Text style={[ui.roleSelectText, shiftType === s && ui.roleSelectTextActive]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={ui.fieldLabel}>Client Pays (₹/mo) *</Text>
                  <TextInput style={ui.fieldInput} keyboardType="numeric" value={clientRate} onChangeText={setClientRate} />

                  <Text style={ui.fieldLabel}>Caregiver Gets (₹/mo) *</Text>
                  <TextInput style={ui.fieldInput} keyboardType="numeric" value={caregiverRate} onChangeText={setCaregiverRate} />

                  {/* Live Margin Card */}
                  <View style={[ui.marginBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1, marginVertical: 12 }]}>
                    <View>
                      <Text style={{ fontSize: 11, color: '#166534', fontWeight: '700' }}>AGENCY MARGIN</Text>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: '#15803d' }}>₹{liveMargin.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 11, color: '#166534', fontWeight: '700' }}>MARGIN %</Text>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: '#15803d' }}>{marginPct}%</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={ui.submitBtn} onPress={handleFinishPlacement}>
                    <Text style={ui.submitBtnText}>Confirm Placement & Issue Invoice</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity style={ui.cancelBtn} onPress={() => setCreateModal(false)}>
                <Text style={ui.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

// ── TAB 5: MONEY & LEDGER (WORKFLOWS 6, 7, 10) ────────────────────────────────
const MoneyTab = () => {
  const [subTab, setSubTab] = useState('To collect');
  const [recordModal, setRecordModal] = useState(false);
  const [selectedCollect, setSelectedCollect] = useState(null);
  const [payMethod, setPayMethod] = useState('UPI');

  const [toCollect, setToCollect] = useState([
    { id: '1', client: 'Ramesh Sharma', amount: 23600, due: 'Due in 2 days', overdue: false },
    { id: '2', client: 'Ravi Iyer', amount: 18000, due: 'Overdue 12 days', overdue: true },
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
      `₹${selectedCollect.amount.toLocaleString('en-IN')} confirmed via ${payMethod}.\nDues dropped instantly. Shareable receipt ready.`
    );
  };

  const handlePayCaregiver = (cg) => {
    Alert.alert(
      'Pay Caregiver',
      `Pay ₹${cg.amount.toLocaleString('en-IN')} to ${cg.caregiver} for ${cg.workedDays} days worked?\n(Pre-calculated from verified daily attendance).`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark as Advance', onPress: () => Alert.alert('Recorded', 'Advance payment recorded in ledger.') },
        { text: 'Confirm Payout', onPress: () => {
          setToPay(prev => prev.filter(p => p.id !== cg.id));
          Alert.alert('Success', `Salary payout of ₹${cg.amount} confirmed.`);
        }}
      ]
    );
  };

  const shareStatement = () => {
    Share.share({
      message: `*Sunrise Home Care - Account Statement*\nClient: Ramesh Sharma\nPeriod: Jun - Jul 2026\n------------------------\nTotal Billed: ₹30,000\nAbsence Credit: -₹1,000 (1 day)\nPayment: ₹10,000 (UPI)\n------------------------\nNet Balance Due: ₹19,000\nPay via UPI: sunrise@upi`
    });
  };

  return (
    <View style={ui.screen}>
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
            >
              <Text style={[ui.segmentText, subTab === t && ui.segmentTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {subTab === 'To collect' && (
        <ScrollView style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
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
                  <TouchableOpacity style={ui.recordBtn} onPress={() => handleOpenRecord(item)}>
                    <Text style={ui.recordBtnText}>Record Payment</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {subTab === 'To pay' && (
        <ScrollView style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          <View style={[ui.moneySummaryBox, { backgroundColor: '#fefce8' }]}>
            <Text style={{ fontSize: 13, color: '#854d0e', fontWeight: '700' }}>TOTAL CAREGIVER PAYABLE</Text>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#a16207', marginTop: 2 }}>₹14,000</Text>
          </View>

          {toPay.map(cg => (
            <View key={cg.id} style={ui.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={ui.cardTitle}>{cg.caregiver}</Text>
                  <Text style={ui.cardSub}>{cg.workedDays} days worked (calculated from attendance)</Text>
                  {cg.advance > 0 && <Text style={{ fontSize: 12, color: '#b45309' }}>Advance paid: ₹{cg.advance}</Text>}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>
                    ₹{cg.amount.toLocaleString('en-IN')}
                  </Text>
                  <TouchableOpacity style={[ui.recordBtn, { backgroundColor: '#1e293b' }]} onPress={() => handlePayCaregiver(cg)}>
                    <Text style={ui.recordBtnText}>Pay Caregiver</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {subTab === 'Client Ledger' && (
        <ScrollView style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          <View style={ui.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <Text style={ui.cardTitle}>Ramesh Sharma's Ledger</Text>
                <Text style={ui.cardSub}>Every charge, payment & absence in order</Text>
              </View>
              <TouchableOpacity style={ui.shareBtn} onPress={shareStatement}>
                <Text style={ui.shareBtnText}>📤 Share</Text>
              </TouchableOpacity>
            </View>

            <View style={ui.ledgerRow}>
              <Text style={ui.ledgerDate}>01 Jun 2026</Text>
              <Text style={ui.ledgerDesc}>24h Care Service (1 Month)</Text>
              <Text style={ui.ledgerAmount}>₹30,000</Text>
            </View>

            <View style={ui.ledgerRow}>
              <Text style={ui.ledgerDate}>05 Jun 2026</Text>
              <Text style={[ui.ledgerDesc, { color: '#b91c1c' }]}>Absence adjustment: 1 day unserved</Text>
              <Text style={[ui.ledgerAmount, { color: '#b91c1c' }]}>-₹1,000</Text>
            </View>

            <View style={ui.ledgerRow}>
              <Text style={ui.ledgerDate}>10 Jun 2026</Text>
              <Text style={[ui.ledgerDesc, { color: '#15803d' }]}>Payment via UPI (Ref #826351)</Text>
              <Text style={[ui.ledgerAmount, { color: '#15803d' }]}>-₹10,000</Text>
            </View>

            <View style={[ui.ledgerRow, { borderTopWidth: 1.5, borderColor: '#cbd5e1', paddingTop: 8, marginTop: 8 }]}>
              <Text style={[ui.ledgerDesc, { fontWeight: '800' }]}>Net Outstanding Balance</Text>
              <Text style={[ui.ledgerAmount, { fontSize: 18, fontWeight: '900', color: '#b91c1c' }]}>₹19,000</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Record Collection Modal (Workflow 6) */}
      <Modal visible={recordModal} transparent animationType="slide">
        <View style={ui.modalOverlay}>
          <View style={ui.modalCard}>
            <Text style={ui.modalTitle}>Record Collection</Text>
            <Text style={ui.modalSub}>From: {selectedCollect?.client} • Amount: ₹{selectedCollect?.amount?.toLocaleString('en-IN')}</Text>

            <Text style={ui.fieldLabel}>Payment Method</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {['UPI', 'Cash', 'Bank'].map(m => (
                <TouchableOpacity
                  key={m}
                  style={[ui.roleSelectPill, payMethod === m && ui.roleSelectPillActive]}
                  onPress={() => setPayMethod(m)}
                >
                  <Text style={[ui.roleSelectText, payMethod === m && ui.roleSelectTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={ui.submitBtn} onPress={handleConfirmCollection}>
              <Text style={ui.submitBtnText}>Confirm Collection</Text>
            </TouchableOpacity>

            <TouchableOpacity style={ui.cancelBtn} onPress={() => setRecordModal(false)}>
              <Text style={ui.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ── ROOT CARE-C TAB NAVIGATOR ────────────────────────────────────────────────
export default function CareCDashboard({ token, onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0f172a',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ focused }) => {
          const icons = {
            Today: '📅',
            Caregivers: '👥',
            Clients: '🤝',
            Placements: '📋',
            Money: '💰'
          };
          return <Text style={{ fontSize: 20 }}>{icons[route.name]}</Text>;
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

// ── CARE-C DESIGN SYSTEM STYLES ──────────────────────────────────────────────
const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  topHeader: { backgroundColor: '#ffffff', padding: 16, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  agencyTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  agencySub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  signoutBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  signoutText: { fontSize: 11, fontWeight: '800', color: '#b91c1c' },

  headerWithAction: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' },
  pageTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  pageSub: { fontSize: 12, color: '#64748b', marginTop: 1 },
  primaryAddBtn: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  primaryAddBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  statBox: { flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  statLabel: { fontSize: 10, fontWeight: '800', color: '#64748b', letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginTop: 4 },

  datePill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#e2e8f0' },
  datePillActive: { backgroundColor: '#0f172a' },
  datePillText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  datePillTextActive: { color: '#ffffff' },

  sectionHeader: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  badgeMuted: { fontSize: 12, color: '#64748b' },

  alertCard: { backgroundColor: '#fffbeb', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#fde68a', flexDirection: 'row', alignItems: 'center' },
  alertTitle: { fontSize: 14, fontWeight: '800', color: '#92400e' },
  alertSub: { fontSize: 12, color: '#b45309', marginTop: 1 },
  alertActionBtn: { backgroundColor: '#d97706', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  alertActionText: { color: '#fff', fontWeight: '800', fontSize: 12 },

  card: { backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  cardSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  roleTag: { fontSize: 11, fontWeight: '700', color: '#0284c7', backgroundColor: '#e0f2fe', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },

  checkBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#86efac' },
  checkBtnText: { fontSize: 18, fontWeight: '900', color: '#15803d' },
  crossBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fca5a5' },
  crossBtnText: { fontSize: 18, fontWeight: '900', color: '#b91c1c' },

  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 5 },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 11, fontWeight: '800' },

  searchInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 12, fontSize: 14, color: '#0f172a' },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f1f5f9' },
  filterPillActive: { backgroundColor: '#0f172a' },
  filterPillText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  filterPillTextActive: { color: '#ffffff' },

  skillTag: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  skillText: { fontSize: 11, color: '#475569', fontWeight: '600' },

  segmentTrack: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: 10, padding: 3 },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  segmentBtnActive: { backgroundColor: '#ffffff', elevation: 1 },
  segmentText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  segmentTextActive: { color: '#0f172a' },

  tagUrgent: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagUrgentText: { fontSize: 10, fontWeight: '800', color: '#b91c1c' },
  convertBtn: { marginTop: 10, backgroundColor: '#0f172a', padding: 10, borderRadius: 8, alignItems: 'center' },
  convertBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },

  marginBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, marginTop: 12 },
  marginSub: { fontSize: 10, fontWeight: '800', color: '#64748b' },
  marginVal: { fontSize: 14, fontWeight: '900', color: '#0f172a', marginTop: 2 },

  actionPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
  actionPillText: { fontSize: 12, fontWeight: '700', color: '#334155' },

  moneySummaryBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  recordBtn: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 6 },
  recordBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  shareBtn: { backgroundColor: '#e0f2fe', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  shareBtnText: { color: '#0369a1', fontSize: 12, fontWeight: '800' },
  ledgerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  ledgerDate: { fontSize: 11, color: '#94a3b8', width: 70 },
  ledgerDesc: { fontSize: 12, color: '#334155', flex: 1 },
  ledgerAmount: { fontSize: 13, fontWeight: '800', color: '#0f172a' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  modalSub: { fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 16 },
  optionCard: { padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#cbd5e1', backgroundColor: '#f8fafc' },
  optionTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  optionSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 6 },
  fieldInput: { borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, fontSize: 14, color: '#0f172a', marginBottom: 12 },
  roleSelectPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1' },
  roleSelectPillActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  roleSelectText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  roleSelectTextActive: { color: '#ffffff' },
  submitBtn: { backgroundColor: '#0f172a', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  cancelBtn: { padding: 12, alignItems: 'center', marginTop: 4 },
  cancelBtnText: { color: '#64748b', fontSize: 13, fontWeight: '700' },
  prefillNotice: { backgroundColor: '#f0fdf4', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  pickerOption: { padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#cbd5e1', backgroundColor: '#fff' },
  pickerOptionTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  pickerOptionSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
});
