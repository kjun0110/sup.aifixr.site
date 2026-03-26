import { SignupRegister } from '../../../components/auth/SignupRegister';

export default async function SignupRegisterInvitePage({
  params,
}: {
  params: Promise<{ invite: string }>;
}) {
  const { invite } = await params;
  return <SignupRegister invite={invite} />;
}

