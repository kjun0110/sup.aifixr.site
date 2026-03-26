import { ThirdPartyInfoAgreementSign } from '../../components/auth/ThirdPartyInfoAgreementSign';

export default async function SignupAgreementInvitePage({
  params,
}: {
  params: Promise<{ invite: string }>;
}) {
  const { invite } = await params;
  return <ThirdPartyInfoAgreementSign invite={invite} />;
}

