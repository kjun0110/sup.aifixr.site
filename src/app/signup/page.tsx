import { ThirdPartyInfoAgreementSign } from '../components/auth/ThirdPartyInfoAgreementSign';
import { redirect } from 'next/navigation';

export default function SignupAgreementPage({
  searchParams,
}: {
  searchParams?: { invite?: string };
}) {
  const invite = searchParams?.invite;
  if (invite) {
    redirect(`/signup/${encodeURIComponent(invite)}`);
  }
  return (
    <ThirdPartyInfoAgreementSign
      invite={undefined}
    />
  );
}

