export interface MemberGroup {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface PrefectureGroup {
  id: number;
  name: string;
  crest: string;
  count: number;
}

export interface MemberOfficial {
  id: number;
  name: string;
  surname: string;
  role: string;
  photo: string;
  memberId: number;
  canEdit: boolean;
}

export interface MemberSummary {
  id: number;
  name: string;
  surname: string;
  title: string;
  status: string;
  prefecture: string;
  email: string;
  mobile: string;
  photo: string;
  canEdit: boolean;
}

export interface MembersPage {
  title: string;
  slug: string;
  crest: string;
  canManage: boolean;
  types: MemberGroup[];
  prefectures: PrefectureGroup[];
  officials: MemberOfficial[];
  members: MemberSummary[];
}

export interface MemberDetail {
  id: number;
  name: string;
  surname: string;
  status: string;
  photo: string;
  birthDate: string;
  address: string;
  city: string;
  postalCode: string;
  homePhone: string;
  mobile: string;
  officePhone: string;
  prefecture: string;
  membershipYear: string;
  email: string;
  nobleTitles: string;
  activity: string;
  freeInitiatives: string;
  sport: string;
  interests: string;
  iAm: string;
  iAmNot: string;
  myths: string;
  tastes: string;
  enemies: string;
  masters: string;
  motto: string;
}

export interface LegacyPage { html: string; title: string; }
