import { config } from '@/config';
import { AuthLayout } from '@/presentation/shared/layouts/AuthLayout';
import { MatPanel } from '@/presentation/shared/molecules/MatPanel';
import { BeforeAfterShowcase } from '@/presentation/features/auth/molecules/BeforeAfterShowcase';
import { EmailAuthForm } from '@/presentation/features/auth/organisms/EmailAuthForm';
import { SampleHouseAccess } from '@/presentation/features/auth/organisms/SampleHouseAccess';

function ProductStory() {
  return (
    <MatPanel className="flex h-full min-h-dvh flex-col justify-center gap-7 rounded-none px-12 py-8 2xl:gap-12 2xl:px-20 2xl:py-16">
      <div className="max-w-2xl space-y-5">
        <h1 className="text-[42px] font-medium leading-[1.05] 2xl:text-[52px] tracking-[-0.02em] text-mat-ink">
          See your house in new finishes, and what they cost
        </h1>
        <p className="max-w-xl text-lg leading-7 text-mat-line/85">
          Upload one photo, mark the walls, roof and doors, choose paint, stone or cladding, and get
          quantities and a rupee estimate to take to your contractor.
        </p>
      </div>
      <div className="max-w-2xl 2xl:max-w-3xl">
        <BeforeAfterShowcase />
      </div>
    </MatPanel>
  );
}

export function LoginPage() {
  return (
    <AuthLayout visual={<ProductStory />}>
      <div className="space-y-7">
        <div className="space-y-2">
          <h2 className="text-[26px] font-medium text-stone-900">Welcome to {config.appName}</h2>
          <p className="text-sm leading-relaxed text-stone-600">
            Sign in to your houses, or create an account to start one.
          </p>
        </div>

        <EmailAuthForm />

        <div className="flex items-center gap-3 text-xs text-stone-500">
          <span className="h-px flex-1 bg-stone-200" />
          or
          <span className="h-px flex-1 bg-stone-200" />
        </div>

        <SampleHouseAccess />
      </div>
    </AuthLayout>
  );
}
