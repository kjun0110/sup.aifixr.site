import { ThirdPartyInfoAgreementSign } from '../../components/auth/ThirdPartyInfoAgreementSign';

export default function SignupAgreementInvitePage({
  params,
}: {
  params: { invite: string };
}) {
  return <ThirdPartyInfoAgreementSign invite={params.invite} />;
}

