'use client';

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import type { ChangeEvent } from "react";
import { 
  ArrowLeft, 
  Download, 
  Building2, 
  MapPin, 
  Package, 
  TrendingUp,
  Info,
  AlertCircle,
  Plus,
  Upload,
  Send
} from "lucide-react";
import { FacilitiesTab } from "./SupplierDetailFacilitiesTabNew";
import { toast } from 'sonner';

// Mock supplier data
const mockSupplierData: Record<string, any> = {
  own: {
    name: "우리회사",
    country: "South Korea",
    location: "Seoul, South Korea",
    type: "배터리 소재 제조",
    supplierType: "Own Company",
    product: "배터리 소재",
    volume: "50,000 kg",
    pcf: "18,450.2 kg CO2e",
    status: "완료",
    companyInfo: {
      registrationNumber: "KR-9876543210",
      dunsNumber: "DUNS-98765432",
      taxId: "TAX-KR-OWN",
      website: "https://ourcompany.co.kr",
      representative: "김대표",
      email: "ceo@ourcompany.co.kr",
      phone: "+82-2-1234-5678",
      rmiSmelter: "인증됨",
      feoc: "인증됨",
    },
    facilities: [
      {
        id: "FAC-HQ",
        name: "본사",
        country: "South Korea",
        address: "Seoul, South Korea",
        representative: "김대표",
        email: "ceo@ourcompany.co.kr",
        phone: "+82-2-1234-5678",
        renewableEnergy: "사용",
        certification: "ISO 14001, ISO 9001",
        rmiSmelter: "인증됨",
        feoc: "인증됨",
      },
      {
        id: "FAC-CA",
        name: "천안공장",
        country: "South Korea",
        address: "Cheonan-si, Chungcheongnam-do, South Korea",
        representative: "박공장장",
        email: "park@ourcompany.co.kr",
        phone: "+82-41-1234-5678",
        renewableEnergy: "사용",
        certification: "ISO 14001",
        rmiSmelter: "인증됨",
        feoc: "인증됨",
      },
    ],
    products: [
      {
        materialId: "MAT-BAT-001",
        name: "배터리 소재",
        quantity: "50,000",
        unit: "kg",
        standardWeight: "1.0",
        unitWeight: "kg",
        hsCode: "2805.30",
        mineralType: "리튬",
        mineralContent: "98.0%",
        mineralRatio: "92%",
        origin: "한국",
      },
    ],
    production: [
      {
        inputCategory: "원자재",
        inputName: "리튬 정련 소재",
        inputQuantity: "52,000",
        inputUnit: "kg",
        inputRatio: "104%",
        energyType: "전기",
        energyUsage: "80,000",
        energyUnit: "kWh",
        transportType: "육운",
        transportMethod: "트럭",
        origin: "천안공장",
        destination: "본사",
        standardWeight: "50,000",
        actualWeight: "49,800",
        output: "49,800",
        loss: "200",
        waste: "180",
        emissionFactor: "0.368",
      },
    ],
    contacts: [
      {
        department: "영업부",
        position: "부장",
        name: "최영업",
        email: "choi@ourcompany.co.kr",
        phone: "+82-10-1111-2222",
      },
      {
        department: "생산부",
        position: "부장",
        name: "정생산",
        email: "jung@ourcompany.co.kr",
        phone: "+82-10-3333-4444",
      },
      {
        department: "품질부",
        position: "과장",
        name: "이품질",
        email: "lee@ourcompany.co.kr",
        phone: "+82-10-5555-6666",
      },
    ],
  },
  supplier1: {
    name: "한국배터리 (Korea Battery Co.)",
    country: "South Korea",
    location: "Cheonan-si, Chungcheongnam-do, South Korea",
    type: "Battery Manufacturer",
    supplierType: "Supplier",
    product: "리튬 정련 소재",
    volume: "36,000 kg",
    pcf: "12,820.4 kg CO2e",
    status: "검토완료",
    companyInfo: {
      registrationNumber: "KR-1234567890",
      dunsNumber: "DUNS-12345678",
      taxId: "TAX-KR-BATTERY",
      website: "https://koreabattery.co.kr",
      representative: "김철수",
      email: "ceo@koreabattery.co.kr",
      phone: "+82-41-1234-5678",
      rmiSmelter: "인증됨",
      feoc: "인증됨",
    },
    facilities: [
      {
        id: "FAC-001",
        name: "본사",
        country: "South Korea",
        address: "Cheonan-si, Chungcheongnam-do, South Korea",
        representative: "김철수",
        email: "ceo@koreabattery.co.kr",
        phone: "+82-41-1234-5678",
        renewableEnergy: "사용",
        certification: "ISO 14001",
        rmiSmelter: "인증됨",
        feoc: "인증됨",
      },
    ],
    products: [
      {
        materialId: "MAT-LI-001",
        name: "리튬 정련 소재",
        quantity: "36,000",
        unit: "kg",
        standardWeight: "1.2",
        unitWeight: "kg",
        hsCode: "2805.19",
        mineralType: "리튬",
        mineralContent: "99.5%",
        mineralRatio: "95%",
        origin: "호주",
      },
    ],
    production: [
      {
        inputCategory: "원자재",
        inputName: "리튬 정광",
        inputQuantity: "40,000",
        inputUnit: "kg",
        inputRatio: "110%",
        energyType: "전기",
        energyUsage: "50,000",
        energyUnit: "kWh",
        transportType: "해운",
        transportMethod: "컨테이너선",
        origin: "호주 항구",
        destination: "인천항",
        standardWeight: "36,000",
        actualWeight: "35,800",
        output: "35,800",
        loss: "200",
        waste: "150",
        emissionFactor: "0.358",
      },
    ],
    contacts: [
      {
        department: "영업부",
        position: "부장",
        name: "이영희",
        email: "yh.lee@koreabattery.co.kr",
        phone: "+82-10-1234-5678",
      },
      {
        department: "생산부",
        position: "과장",
        name: "박민수",
        email: "ms.park@koreabattery.co.kr",
        phone: "+82-10-2345-6789",
      },
    ],
  },
};

export function SupplierDetail() {
  const params = useParams();
  const supplierId = typeof params.supplierId === 'string' ? params.supplierId : params.supplierId?.[0];
  const projectId = typeof params.projectId === 'string' ? params.projectId : params.projectId?.[0];
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("company-info");
  const [isHQSameFacility, setIsHQSameFacility] = useState<boolean | null>(null);
  const [showFacilityForm, setShowFacilityForm] = useState(false);
  const [newFacility, setNewFacility] = useState({
    id: '',
    name: '',
    country: '',
    address: '',
    representative: '',
    email: '',
    phone: '',
    renewableEnergy: '',
    certification: '',
    rmiSmelter: '',
    feoc: '',
  });
  const [editableData, setEditableData] = useState({
    rmiSmelter: '',
    feoc: '',
    type: '',
  });

  // Excel upload (mock) - 탭별로 업로드 버튼을 눌렀을 때 어떤 탭인지 식별
  const excelFileInputRef = useRef<HTMLInputElement | null>(null);
  const [excelUploadTabId, setExcelUploadTabId] = useState<string | null>(null);

  // 수정 요청 모달 상태
  const [showRevisionRequestModal, setShowRevisionRequestModal] = useState(false);
  const [revisionRequestTarget, setRevisionRequestTarget] = useState('');
  const [revisionRequestDataType, setRevisionRequestDataType] = useState('');
  const [revisionRequestContent, setRevisionRequestContent] = useState('');

  const supplierFromQuery = (() => {
    const name = searchParams.get('supplierName');
    if (!name) return null;

    const country = searchParams.get('supplierCountry') ?? '';
    const supplierType = searchParams.get('supplierType') ?? '';
    const volume = searchParams.get('supplierVolume') ?? '';
    const status = searchParams.get('supplierStatus') ?? '';
    const pcf = searchParams.get('supplierPcfStatus') ?? '';
    const id = supplierId ?? 'unknown';

    // 상세 페이지에서 사용되는 필드들을 최소 구성으로 채웁니다.
    return {
      id,
      name,
      country,
      location: country,
      type: supplierType,
      supplierType: 'Supplier',
      product: '-',
      volume,
      pcf,
      status,
      companyInfo: {
        registrationNumber: `KR-${id.toUpperCase().slice(0, 10).replace(/[^A-Z0-9]/g, '')}`,
        dunsNumber: `DUNS-${id.toUpperCase().slice(0, 10).replace(/[^A-Z0-9]/g, '')}`,
        taxId: `TAX-${id.toUpperCase().slice(0, 10).replace(/[^A-Z0-9]/g, '')}`,
        website: `https://example.com/${encodeURIComponent(id)}`,
        representative: `${name} 대표`,
        email: `ceo@${encodeURIComponent(name).replace(/%20/g, '').toLowerCase()}.com`,
        phone: '+82-10-0000-0000',
        rmiSmelter: '미인증',
        feoc: '미인증',
      },
      facilities: [
        {
          id: `FAC-${id}`,
          name: '기본 사업장',
          country,
          address: `${country}`,
          representative: `${name} 대표`,
          email: `ceo@${encodeURIComponent(name).replace(/%20/g, '').toLowerCase()}.com`,
          phone: '+82-10-0000-0000',
          renewableEnergy: '미사용',
          certification: '-',
          rmiSmelter: '미인증',
          feoc: '미인증',
        },
      ],
      products: [],
      production: [],
      contacts: [],
    };
  })();

  const supplier = supplierFromQuery
    ? supplierFromQuery
    : supplierId
      ? mockSupplierData[supplierId as keyof typeof mockSupplierData]
      : mockSupplierData['supplier1'];

  // 권한 정책(협력사 포털):
  // - tier1: 모든 하위차사에게 수정요청 가능
  // - tier2~: "직하위차사"에게만 수정요청 가능
  const projectTierById: Record<string, number> = {
    p1: 1,
    p2: 2,
    p3: 3,
  };

  const currentTierNum = projectId ? (projectTierById[projectId] ?? 1) : 1;

  const getSupplierTierNum = (id: string | undefined) => {
    if (!id) return null;
    if (id === 'own') return currentTierNum;
    const m = id.match(/^tier(\d+)-/);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  };

  const targetTierNum = getSupplierTierNum(supplierId);
  const canSendRevisionRequest =
    supplierId !== 'own' &&
    (currentTierNum === 1 ? true : targetTierNum !== null && targetTierNum === currentTierNum + 1);

  // Initialize editable data when supplier changes
  useState(() => {
    if (supplier) {
      setEditableData({
        rmiSmelter: supplier.companyInfo.rmiSmelter,
        feoc: supplier.companyInfo.feoc,
        type: supplier.type,
      });
    }
  });

  const handleOpenRevisionRequest = () => {
    setRevisionRequestTarget(supplier?.name ?? '');
    setRevisionRequestDataType('');
    setRevisionRequestContent('');
    setShowRevisionRequestModal(true);
  };

  const handleSendRevisionRequest = () => {
    if (!revisionRequestDataType) {
      toast.error('요청 데이터 유형을 선택해주세요');
      return;
    }
    if (!revisionRequestContent.trim()) {
      toast.error('요청 내용을 입력해주세요');
      return;
    }
    setShowRevisionRequestModal(false);
    toast.success('요청 전송이 완료되었습니다 (mock)');
  };

  if (!supplier) {
    return (
      <div>
        <div className="text-center">
          <h2 className="text-2xl mb-4" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
            협력사를 찾을 수 없습니다
          </h2>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl text-white"
            style={{ background: 'var(--aifix-primary)' }}
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "company-info", label: "기업 및 조직 식별 정보" },
    { id: "facilities", label: "사업장 정보" },
    { id: "products", label: "납품 제품 정보" },
    { id: "production", label: "활동데이터" },
    { id: "contacts", label: "담당자 정보" },
  ];

  const handleExcelDownload = (tabId: string) => {
    const tabLabel = tabs.find((t) => t.id === tabId)?.label ?? tabId;
    toast.success(`${tabLabel} 엑셀 다운로드 준비 (mock)`);
  };

  const handleExcelUploadClick = (tabId: string) => {
    setExcelUploadTabId(tabId);
    excelFileInputRef.current?.click();
  };

  const handleExcelFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !excelUploadTabId) return;

    const tabLabel = tabs.find((t) => t.id === excelUploadTabId)?.label ?? excelUploadTabId;
    toast.success(`${tabLabel} 엑셀 업로드 완료: ${file.name} (mock)`);

    // allow re-uploading same file
    e.target.value = '';
    setExcelUploadTabId(null);
  };

  const TabExcelActions = ({ tabId }: { tabId: string }) => {
    return (
      <div className="flex items-center justify-end gap-3 mb-4">
        <button
          type="button"
          onClick={() => handleExcelDownload(tabId)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border transition-all duration-200 hover:bg-gray-50"
          style={{
            borderColor: 'var(--aifix-gray)',
            color: 'var(--aifix-navy)',
            backgroundColor: 'white',
          }}
        >
          <Download className="w-5 h-5" />
          <span style={{ fontWeight: 600 }}>엑셀 다운로드</span>
        </button>

        <button
          type="button"
          onClick={() => handleExcelUploadClick(tabId)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90"
          style={{
            background: 'var(--aifix-primary)',
          }}
        >
          <Upload className="w-5 h-5" />
          <span style={{ fontWeight: 600 }}>엑셀 업로드</span>
        </button>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "company-info":
        return (
          <div className="bg-white rounded-[20px] p-8" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
            {supplierId === 'own' && <TabExcelActions tabId="company-info" />}
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4" style={{ width: '200px', color: 'var(--aifix-gray)', fontWeight: 500 }}>
                    회사명 {supplierId === 'own' && <span style={{ fontSize: '12px', color: '#94A3B8' }}>*</span>}
                  </td>
                  <td className="py-4 px-4">
                    {supplierId === 'own' ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.name}</span>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>회원 관리에서 수정</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.name}</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-gray)', fontWeight: 500 }}>
                    사업자등록번호 {supplierId === 'own' && <span style={{ fontSize: '12px', color: '#94A3B8' }}>*</span>}
                  </td>
                  <td className="py-4 px-4">
                    {supplierId === 'own' ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.registrationNumber}</span>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>회원 관리에서 수정</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.registrationNumber}</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-gray)', fontWeight: 500 }}>
                    국가 소재지
                  </td>
                  <td className="py-4 px-4">
                    {supplierId === 'own' ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.country}</span>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>회원 관리에서 수정</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.country}</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-gray)', fontWeight: 500 }}>
                    상세주소
                  </td>
                  <td className="py-4 px-4">
                    {supplierId === 'own' ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.location}</span>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>회원 관리에서 수정</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.location}</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-gray)', fontWeight: 500 }}>
                    DUNS Number
                  </td>
                  <td className="py-4 px-4">
                    {supplierId === 'own' ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.dunsNumber}</span>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>회원 관리에서 수정</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.dunsNumber}</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-gray)', fontWeight: 500 }}>
                    텍스 ID
                  </td>
                  <td className="py-4 px-4">
                    {supplierId === 'own' ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.taxId}</span>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>회원 관리에서 수정</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.taxId}</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-gray)', fontWeight: 500 }}>
                    공식 홈페이지 주소
                  </td>
                  <td className="py-4 px-4">
                    {supplierId === 'own' ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.website}</span>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>회원 관리에서 수정</span>
                      </div>
                    ) : (
                      <a 
                        href={supplier.companyInfo.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'var(--aifix-primary)', textDecoration: 'underline' }}
                      >
                        {supplier.companyInfo.website}
                      </a>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-gray)', fontWeight: 500 }}>
                    대표자명 {supplierId === 'own' && <span style={{ fontSize: '12px', color: '#94A3B8' }}>*</span>}
                  </td>
                  <td className="py-4 px-4">
                    {supplierId === 'own' ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.representative}</span>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>회원 관리에서 수정</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.representative}</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-gray)', fontWeight: 500 }}>
                    대표 이메일
                  </td>
                  <td className="py-4 px-4">
                    {supplierId === 'own' ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.email}</span>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>회원 관리에서 수정</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.email}</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-gray)', fontWeight: 500 }}>
                    대표자 연락처
                  </td>
                  <td className="py-4 px-4">
                    {supplierId === 'own' ? (
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.phone}</span>
                        <span style={{ fontSize: '12px', color: '#94A3B8' }}>회원 관리에서 수정</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.phone}</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-gray)', fontWeight: 500 }}>
                    RMI Smelter 여부
                  </td>
                  <td className="py-4 px-4">
                    {supplierId === 'own' ? (
                      <select
                        value={editableData.rmiSmelter}
                        className="flex-1 px-4 py-2 rounded-lg border w-full transition-all duration-200 focus:outline-none focus:ring-2"
                        style={{ 
                          borderColor: '#E2E8F0', 
                          color: 'var(--aifix-navy)',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--aifix-primary)'}
                        onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                        onChange={(e) => setEditableData({ ...editableData, rmiSmelter: e.target.value })}
                      >
                        <option value="인증됨">인증됨</option>
                        <option value="미인증">미인증</option>
                        <option value="진행중">진행중</option>
                      </select>
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.rmiSmelter}</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-gray)', fontWeight: 500 }}>
                    FEOC 여부
                  </td>
                  <td className="py-4 px-4">
                    {supplierId === 'own' ? (
                      <select
                        value={editableData.feoc}
                        className="flex-1 px-4 py-2 rounded-lg border w-full transition-all duration-200 focus:outline-none focus:ring-2"
                        style={{ 
                          borderColor: '#E2E8F0', 
                          color: 'var(--aifix-navy)',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--aifix-primary)'}
                        onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                        onChange={(e) => setEditableData({ ...editableData, feoc: e.target.value })}
                      >
                        <option value="인증됨">인증됨</option>
                        <option value="미인증">미인증</option>
                        <option value="진행중">진행중</option>
                      </select>
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.companyInfo.feoc}</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-4" style={{ color: 'var(--aifix-gray)', fontWeight: 500 }}>
                    공급자 유형
                  </td>
                  <td className="py-4 px-4">
                    {supplierId === 'own' ? (
                      <input
                        type="text"
                        value={editableData.type}
                        className="flex-1 px-4 py-2 rounded-lg border w-full transition-all duration-200 focus:outline-none focus:ring-2"
                        style={{ 
                          borderColor: '#E2E8F0', 
                          color: 'var(--aifix-navy)',
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--aifix-primary)'}
                        onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                        onChange={(e) => setEditableData({ ...editableData, type: e.target.value })}
                      />
                    ) : (
                      <span style={{ color: 'var(--aifix-navy)', fontWeight: 500 }}>{supplier.type}</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case "facilities":
        return (
          <div className="space-y-4">
            {supplierId === 'own' && <TabExcelActions tabId="facilities" />}
            <FacilitiesTab 
              supplierId={supplierId || 'supplier1'}
              supplier={supplier}
            />
          </div>
        );

      case "products":
        return (
          <div className="bg-white rounded-[20px] overflow-hidden" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
            <div className="p-6 pb-0">
              {supplierId === 'own' && <TabExcelActions tabId="products" />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#F8F9FA' }}>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      자재 ID
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      제품명
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      납품 수량
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      기본 단위
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      제품표준중량
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      제품 단위 중량
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      HS 코드
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      광물 종류
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      광물 함량
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      광물 제품중 비율
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      광물 원산지
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {supplier.products.map((product: any, index: number) => (
                    <tr key={index} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {product.materialId}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {product.name}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {product.quantity}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {product.unit}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {product.standardWeight}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {product.unitWeight}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {product.hsCode}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {product.mineralType}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {product.mineralContent}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {product.mineralRatio}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {product.origin}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "production":
        return (
          <div className="bg-white rounded-[20px] overflow-hidden" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
            <div className="p-6 pb-0">
              {supplierId === 'own' && <TabExcelActions tabId="production" />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#F8F9FA' }}>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      투입자재 카테고리
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      투입자재명
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      투입수량
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      단위
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      자재 제품중 비율
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      투입 에너지 유형
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      에너지 사용량
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      에너지 단위
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      운송유형
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      운송수단
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      출발지
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      도착지
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      제품 표준 중량
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      순중량 실측치
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      산출물 (완제품)
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      손실량 (Scrap)
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      산출 폐기물
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      배출계수
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {supplier.production.map((item: any, index: number) => (
                    <tr key={index} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {item.inputCategory}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {item.inputName}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {item.inputQuantity}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {item.inputUnit}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {item.inputRatio}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {item.energyType}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {item.energyUsage}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {item.energyUnit}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {item.transportType}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {item.transportMethod}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {item.origin}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {item.destination}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {item.standardWeight}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {item.actualWeight}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {item.output}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {item.loss}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {item.waste}
                      </td>
                      <td className="py-4 px-4" style={{ color: 'var(--aifix-navy)', fontSize: '14px' }}>
                        {item.emissionFactor}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "contacts":
        return (
          <div className="bg-white rounded-[20px] overflow-hidden" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
            <div className="p-6 pb-0">
              {supplierId === 'own' && <TabExcelActions tabId="contacts" />}
            </div>
            {supplierId === 'own' && (
              <div className="p-4 border-b border-gray-200" style={{ backgroundColor: '#F8FAFC' }}>
                <div className="flex items-center gap-2" style={{ color: '#94A3B8', fontSize: '14px' }}>
                  <Info className="w-4 h-4" />
                  <span>담당자 정보는 회원 관리에서 수정할 수 있습니다.</span>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#F8F9FA' }}>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      부서명
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      직급
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      이름
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      이메일
                    </th>
                    <th className="py-4 px-4 text-left" style={{ color: 'var(--aifix-navy)', fontWeight: 600, fontSize: '14px' }}>
                      연락처
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {supplier.contacts.map((contact: any, index: number) => (
                    <tr 
                      key={index} 
                      className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                      style={supplierId === 'own' ? { backgroundColor: '#F8FAFC' } : {}}
                    >
                      <td className="py-4 px-4" style={{ color: supplierId === 'own' ? '#94A3B8' : 'var(--aifix-navy)', fontSize: '14px' }}>
                        {contact.department}
                      </td>
                      <td className="py-4 px-4" style={{ color: supplierId === 'own' ? '#94A3B8' : 'var(--aifix-navy)', fontSize: '14px' }}>
                        {contact.position}
                      </td>
                      <td className="py-4 px-4" style={{ color: supplierId === 'own' ? '#94A3B8' : 'var(--aifix-navy)', fontSize: '14px' }}>
                        {contact.name}
                      </td>
                      <td className="py-4 px-4" style={{ color: supplierId === 'own' ? '#94A3B8' : 'var(--aifix-navy)', fontSize: '14px' }}>
                        {contact.email}
                      </td>
                      <td className="py-4 px-4" style={{ color: supplierId === 'own' ? '#94A3B8' : 'var(--aifix-navy)', fontSize: '14px' }}>
                        {contact.phone}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FA' }}>
      <div>
        {/* Top Section - Company Summary Card */}
        <div className="bg-white rounded-[20px] p-8 mb-6" style={{ boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.05)" }}>
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              {/* Company Icon */}
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #5B3BFA 0%, #00B4FF 100%)' }}
              >
                <Building2 className="w-8 h-8 text-white" />
              </div>

              {/* Company Info */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl" style={{ fontWeight: 700, color: 'var(--aifix-navy)' }}>
                    {supplier.name}
                  </h1>
                  <span 
                    className="px-3 py-1 rounded-lg text-white"
                    style={{ 
                      background: 'linear-gradient(135deg, #00A3B5 0%, #00D0D9 100%)',
                      fontSize: '14px',
                      fontWeight: 600 
                    }}
                  >
                    {supplier.supplierType}
                  </span>
                </div>
                
                <div className="flex items-center gap-6 mb-4" style={{ fontSize: '15px', color: 'var(--aifix-gray)' }}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{supplier.country}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--aifix-gray)', marginBottom: '4px' }}>
                      납품량
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                      {supplier.volume}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--aifix-gray)', marginBottom: '4px' }}>
                      PCF 결과
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--aifix-navy)' }}>
                      {supplier.pcf}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--aifix-gray)', marginBottom: '4px' }}>
                      상태
                    </div>
                    <div>
                      <span 
                        className="px-3 py-1 rounded-lg inline-block"
                        style={{ 
                          backgroundColor: '#FFF4E6',
                          color: '#FF9800',
                          fontSize: '14px',
                          fontWeight: 600 
                        }}
                      >
                        {supplier.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {canSendRevisionRequest && (
                <button
                  onClick={handleOpenRevisionRequest}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90"
                  style={{
                    background: 'linear-gradient(135deg, #5B3BFA 0%, #00B4FF 100%)',
                  }}
                >
                  <Send className="w-5 h-5" />
                  <span style={{ fontWeight: 600 }}>수정 요청</span>
                </button>
              )}
              {supplierId === 'own' && (
                <button
                  onClick={() => {
                    toast.success('저장되었습니다');
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90"
                  style={{ background: 'var(--aifix-primary)' }}
                >
                  <span style={{ fontWeight: 600 }}>수정 완료</span>
                </button>
              )}
              <button
                onClick={() => {
                  try {
                    sessionStorage.setItem('aifix_data_mgmt_from_back_v1', '1');
                  } catch { /* ignore */ }
                  router.push(`/projects/${projectId}?tab=data-mgmt&show=true`);
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border transition-all duration-200 hover:bg-gray-50"
                style={{ 
                  borderColor: 'var(--aifix-gray)',
                  color: 'var(--aifix-navy)' 
                }}
              >
                <ArrowLeft className="w-5 h-5" />
                <span style={{ fontWeight: 600 }}>뒤로가기</span>
              </button>
            </div>
          </div>
        </div>

        {/* Read-Only Notice */}
        {supplierId !== 'own' && (
          <div 
            className="rounded-xl p-4 mb-6 flex items-start gap-3"
            style={{ backgroundColor: '#E3F2FD', border: '1px solid #90CAF9' }}
          >
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#1976D2' }} />
            <div>
              <div style={{ fontWeight: 600, color: '#1565C0', marginBottom: '4px' }}>
                협력사 입력 데이터 (Read Only)
              </div>
              <div style={{ fontSize: '14px', color: '#1976D2' }}>
                {canSendRevisionRequest
                  ? '직하위 협력사 데이터는 직접 수정할 수 없습니다. 필요한 경우 수정 요청을 보낼 수 있습니다.'
                  : '직하위 차수가 아닌 협력사 데이터는 수정 요청을 보낼 수 없습니다.'}
              </div>
            </div>
          </div>
        )}

        {/* Editable Notice for Own Company */}
        {supplierId === 'own' && (
          <div 
            className="rounded-xl p-4 mb-6 flex items-start gap-3"
            style={{ backgroundColor: '#F3E8FF', border: '1px solid #D8B4FE' }}
          >
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#9333EA' }} />
            <div>
              <div style={{ fontWeight: 600, color: '#7E22CE', marginBottom: '4px' }}>
                자사 데이터 입력
              </div>
              <div style={{ fontSize: '14px', color: '#9333EA' }}>
                회사 기본 정보와 담당자 정보는 회원 관리에서 수정할 수 있습니다. 나머지 정보는 여기에서 직접 수정 가능합니다.
              </div>
            </div>
          </div>
        )}

        <input
          ref={excelFileInputRef}
          type="file"
          accept=".csv,.xlsx"
          className="hidden"
          onChange={handleExcelFileChange}
        />

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-6 py-4 border-b-2 transition-all duration-200"
                style={{
                  borderBottomColor: activeTab === tab.id ? 'var(--aifix-primary)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--aifix-primary)' : 'var(--aifix-gray)',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  backgroundColor: 'white',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>

      {/* 수정 요청 모달 */}
      {showRevisionRequestModal && canSendRevisionRequest && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowRevisionRequestModal(false)}
        >
          <div
            className="bg-white rounded-[20px] w-full max-w-[720px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold" style={{ color: 'var(--aifix-navy)' }}>
                협력사 데이터 수정 요청
              </h3>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2">요청 대상 회사</label>
                <input
                  type="text"
                  value={revisionRequestTarget}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">요청 데이터 유형 선택</label>
                <select
                  value={revisionRequestDataType}
                  onChange={(e) => setRevisionRequestDataType(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5B3BFA]"
                >
                  <option value="">선택해주세요</option>
                  <option value="company-info">기업 및 조직 식별 정보</option>
                  <option value="facilities">사업장 정보</option>
                  <option value="products">납품 제품 정보</option>
                  <option value="production">활동데이터</option>
                  <option value="contacts">담당자 정보</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">요청 내용 입력</label>
                <textarea
                  value={revisionRequestContent}
                  onChange={(e) => setRevisionRequestContent(e.target.value)}
                  placeholder="수정이 필요한 내용을 상세히 입력해주세요..."
                  className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5B3BFA]"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRevisionRequestModal(false)}
                className="px-6 py-3 rounded-xl border transition-all duration-200 hover:bg-gray-50"
                style={{
                  borderColor: 'var(--aifix-gray)',
                  color: 'var(--aifix-navy)',
                  background: 'white',
                }}
              >
                취소
              </button>

              <button
                type="button"
                onClick={handleSendRevisionRequest}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all duration-200 hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #5B3BFA 0%, #00B4FF 100%)',
                }}
              >
                <Send className="w-5 h-5" />
                요청 전송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}