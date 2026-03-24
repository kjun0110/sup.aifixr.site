# 🔄 데이터 관리 탭 UI 통합

## 📋 개요

협력사 차수(1차/2차/3차)별로 분리되어 있던 **데이터 관리 화면**을 **단일 UI 구조**로 통합했습니다.

- **기존**: `Tier1DataManagement` / `NonTier1DataManagement` 분리
- **통합**: `DataManagement` 단일 컴포넌트
- **차별화**: 권한(tier prop)에 따라 버튼만 다르게 표시

---

## 🎯 화면 목적

협력사가:
1. **자사 데이터를 입력**하고
2. **하위 협력사 데이터 제출 상태를 확인**하고
3. **데이터 수정 또는 수정요청을 관리**하는

공급망 데이터 관리 화면입니다.

---

## 🏗️ 화면 구조

### 상단 구조
```
데이터 관리
├── 자사 데이터 (탭)
└── 하위 협력사 데이터 (탭)
```

---

## 📊 자사 데이터 탭

### 구조
- **모든 차수 동일 UI**
- **카드형 입력 구조**

### 데이터 섹션
1. ⚡ **에너지 사용 데이터**
   - 전기 사용량 (kWh)
   - 가스 사용량 (m³)
   - 스팀 사용량 (ton)

2. ⛽ **연료 사용 데이터**
   - 경유 사용량 (L)
   - 휘발유 사용량 (L)
   - LPG 사용량 (kg)

3. ⚙️ **공정 데이터**
   - 생산량 (units)
   - 가동시간 (hours)
   - 불량률 (%)

4. 🗑️ **폐기물 데이터**
   - 일반 폐기물 (kg)
   - 지정 폐기물 (kg)
   - 재활용 (kg)

5. 🍃 **기타 환경 데이터**
   - 용수 사용량 (m³)
   - 배수량 (m³)
   - 대기오염물질 (kg)

### 각 카드 구성
- ✏️ 입력 필드 (숫자 + 단위)
- 📎 파일 업로드 (증빙서류, 선택)
- 💾 **임시저장** 버튼
- 📤 **제출** 버튼

---

## 👥 하위 협력사 데이터 탭

### 2-패널 구조

#### 좌측: 협력사 리스트
**컬럼**
- 업체명
- 차수
- 제출 상태
- 최근 제출일
- 마감일

**상단 필터**
- 차수 (전체/2차/3차/4차)
- 제출 상태 (전체/제출완료/제출대기/임시저장)
- 업체 검색

**제출 상태 뱃지**
- ✅ 제출완료 (녹색)
- ⏰ 제출대기 (주황)
- 📄 임시저장 (회색)
- ⚠️ 수정요청 (빨강)

#### 우측: 협력사 데이터 상세
- 선택한 협력사의 **데이터 입력 항목을 카드 형태**로 표시
- **데이터 구조는 자사 데이터와 동일** (에너지/연료/공정/폐기물/환경)
- 권한에 따라 입력 필드 비활성화

---

## 🔐 권한 제어 (RBAC)

**UI 구조는 동일하지만, 사용자 권한에 따라 버튼을 다르게 표시합니다.**

| 협력사 차수 | 하위 데이터 열람 | 데이터 직접 수정 | 수정 요청 | 표시 버튼 |
|-----------|----------------|----------------|-----------|----------|
| **1차**   | ✅ 가능         | ✅ 가능         | ✅ 가능    | 수정 + 수정요청 |
| **2차**   | ✅ 가능         | ❌ 불가능       | ✅ 가능    | 수정요청만 |
| **3차**   | ✅ 가능         | ❌ 불가능       | ✅ 가능    | 수정요청만 |

### 권한별 동작

#### 1차 협력사
```tsx
canDirectEdit = true  // 수정 버튼 표시
canRequest = true     // 수정요청 버튼 표시
```
- 하위 협력사 데이터를 **직접 수정** 가능
- 필요시 **수정 요청**도 가능

#### 2차/3차 협력사
```tsx
canDirectEdit = false // 수정 버튼 숨김
canRequest = true     // 수정요청 버튼만 표시
```
- 하위 협력사 데이터를 **조회만** 가능
- **수정 요청**만 가능 (직접 수정 불가)
- 입력 필드가 `disabled` 상태로 표시

---

## 🎨 디자인 원칙

이 화면은 다음 SaaS UX 패턴을 따릅니다:

1. **공급망 데이터 관리 중심 UI**
   - 자사 데이터와 하위 협력사 데이터를 명확히 구분

2. **동일 UI + 권한 기반 기능 제한**
   - 모든 차수가 같은 화면 구조 사용
   - 권한에 따라 버튼만 차별화

3. **카드 기반 데이터 입력**
   - 데이터 섹션별 독립된 카드
   - 시각적 아이콘으로 섹션 구분

4. **협력사 중심 데이터 조회 구조**
   - 좌측 리스트 + 우측 상세
   - 필터/검색으로 빠른 접근

---

## 🔄 통합 전/후 비교

### 기존 구조
```
❌ 1차: Tier1DataManagement.tsx
❌ 2/3차: NonTier1DataManagement.tsx
```
- 차수별로 완전히 다른 컴포넌트
- 유지보수 비용 증가
- 일관성 부족

### 통합 후
```
✅ 모든 차수: DataManagement.tsx
   - tier prop으로 권한만 구분
   - 단일 코드베이스
   - 일관된 UX
```

---

## 📦 컴포넌트 구조

```tsx
<DataManagement tier={tier}>
  {/* 상단 헤더 */}
  <Header />
  
  {/* 세부 탭 */}
  <SubTabs>
    <Tab id="own-data">자사 데이터</Tab>
    <Tab id="supplier-data">하위 협력사 데이터</Tab>
  </SubTabs>
  
  {/* 탭 컨텐츠 */}
  {activeSubTab === "own-data" ? (
    <OwnDataTab>
      {dataSections.map(section => (
        <DataCard>
          <InputFields />
          <FileUpload />
          <Actions>
            <Button>임시저장</Button>
            <Button>제출</Button>
          </Actions>
        </DataCard>
      ))}
    </OwnDataTab>
  ) : (
    <SupplierDataTab>
      <SupplierList />  {/* 좌측 */}
      <SupplierDetail>  {/* 우측 */}
        {dataSections.map(section => (
          <DataCard>
            <InputFields disabled={!canDirectEdit} />
          </DataCard>
        ))}
        <Actions>
          {canRequest && <Button>수정 요청</Button>}
          {canDirectEdit && <Button>수정</Button>}
        </Actions>
      </SupplierDetail>
    </SupplierDataTab>
  )}
</DataManagement>
```

---

## 🧪 테스트 시나리오

### 1차 협력사
1. "데이터 관리" 탭 클릭
2. "자사 데이터" 탭 확인
   - 모든 섹션 카드 표시
   - 임시저장/제출 버튼 표시
3. "하위 협력사 데이터" 탭 클릭
   - 2차 협력사 목록 확인
   - 협력사 선택 시 "수정" + "수정요청" 버튼 모두 표시
   - 입력 필드 활성화 확인

### 2차 협력사
1. "데이터 관리" 탭 클릭
2. "자사 데이터" 탭 확인
   - 1차와 동일한 UI
3. "하위 협력사 데이터" 탭 클릭
   - 3차 협력사 목록 확인
   - 협력사 선택 시 **"수정요청" 버튼만** 표시
   - 입력 필드 비활성화(disabled) 확인

### 3차 협력사
1. "데이터 관리" 탭 클릭
2. "자사 데이터" 탭만 의미 있음
3. "하위 협력사 데이터" 탭 클릭
   - 하위 협력사 있으면 4차 목록 표시
   - 2차와 동일한 권한 (수정요청만)

---

## ⚙️ 구현 세부사항

### Props
```typescript
type DataManagementProps = {
  tier: "tier1" | "tier2" | "tier3";
};
```

### 권한 로직
```typescript
const canDirectEdit = tier === "tier1"; // 1차만 직접 수정
const canRequest = tier === "tier1" || tier === "tier2"; // 1차, 2차 수정요청
```

### 데이터 섹션 타입
```typescript
type DataSection = {
  id: string;
  title: string;
  icon: any; // Lucide Icon
  fields: { 
    label: string; 
    value: string; 
    unit: string;
  }[];
};
```

### 협력사 데이터 타입
```typescript
type SupplierData = {
  id: string;
  name: string;
  tier: string;
  status: "submitted" | "pending" | "draft" | "revision-requested";
  lastSubmitted?: string;
  deadline: string;
};
```

---

## 🎨 AIFIX 브랜드 스타일

### 색상
- Primary: `#5B3BFA`
- Secondary: `#00B4FF`
- Gradient: `linear-gradient(90deg, #5B3BFA 0%, #00B4FF 100%)`
- Success: `var(--aifix-success)`
- Gray: `var(--aifix-gray)`
- Navy: `var(--aifix-navy)`

### 카드 디자인
- Border Radius: `20px`
- Shadow: `0px 4px 16px rgba(0, 0, 0, 0.05)`

### 버튼 스타일
- 그라디언트 버튼: Primary + Secondary
- 외곽선 버튼: Primary border
- Hover: `scale(1.05)` or `bg-gray-100`

---

## ✅ 중요 원칙

### 데이터 구조 동일성
> **데이터 구조와 입력 항목은 모든 협력사 차수에서 동일해야 합니다.**
> 
> **단지 데이터 수정 권한만 차등 적용됩니다.**

### UI 통일성
- 자사 데이터와 하위 협력사 데이터는 **동일한 데이터 카드 구조** 사용
- 섹션(에너지/연료/공정/폐기물/환경)은 **모든 차수에서 동일**
- 권한에 따라 **버튼과 입력 필드 활성화 상태**만 다름

---

## 📝 다음 단계

이제 데이터 관리 탭이 통합되었으니:

1. ✅ 공급망 관리 탭 통합 완료
2. ✅ 데이터 관리 탭 통합 완료
3. ⏳ 데이터 조회 탭 (필요시 통합)
4. ⏳ PCF 산정/전송 탭 (필요시 통합)
5. ⏳ 이력 탭 (필요시 통합)

---

**🎯 통합 목표**: 협력사 차수와 관계없이 **일관된 UX**를 제공하면서, **권한 기반 접근 제어**로 보안을 유지합니다.
