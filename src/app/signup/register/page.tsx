import { SignupRegister } from '../../components/auth/SignupRegister';
import { redirect } from 'next/navigation';

export default function SignupRegisterPage({
  searchParams,
}: {
  searchParams?: { invite?: string };
}) {
  const invite = searchParams?.invite;
  if (invite) {
    redirect(`/signup/${encodeURIComponent(invite)}/register`);
  }
  return <SignupRegister invite={searchParams?.invite} />;
}

