import { SignupRegister } from '../../../components/auth/SignupRegister';

export default function SignupRegisterInvitePage({
  params,
}: {
  params: { invite: string };
}) {
  return <SignupRegister invite={params.invite} />;
}

