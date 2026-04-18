import { Link } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

const highlights = [
    {
        title: 'Auto-fill in seconds',
        body: 'Filla turns your profile into one-click answers for repetitive job application forms.',
    },
    {
        title: 'Your data stays organized',
        body: 'Personal info, experience, projects, and links live in one profile you control.',
    },
    {
        title: 'Built for real job hunts',
        body: 'Track your direction, tune your preferences, and apply faster with less fatigue.',
    },
]

const steps = [
    {
        number: '01',
        title: 'Create your profile',
        body: 'Complete onboarding once with your role preferences, skills, and work history.',
    },
    {
        number: '02',
        title: 'Connect to your workflow',
        body: 'Use Filla while applying to roles to populate repetitive fields quickly and accurately.',
    },
    {
        number: '03',
        title: 'Keep improving',
        body: 'Refine your profile over time so every new application gets easier and cleaner.',
    },
]

function LandingPage() {
    const { isAuthenticated, loading } = useAuth()

    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_90%_10%,#ffceb8_0%,#f7f4ee_42%),radial-gradient(circle_at_10%_80%,#ffd56f_0%,#f7f4ee_32%)] text-[#1f1c17] font-[monospace]">
            <div className="pointer-events-none absolute -right-12 -top-24 h-80 w-80   bg-[#ff8d62] opacity-35 blur-xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80   bg-[#ffc93e] opacity-35 blur-xl" />

            <header className="fixed inset-x-0 top-0 z-20">
                <div className="mx-auto mt-2 flex w-[min(1120px,calc(100%-2rem))] items-center justify-between border border-[#d9cebc] bg-[color-mix(in_srgb,#fffdf8_88%,transparent)] px-4 py-2 backdrop-blur-md max-[720px]:flex-wrap max-[720px]:gap-3">
                    <div className="inline-flex items-center gap-2.5 text-[1.1rem] font-extrabold tracking-[0.02em]">
                        <a href="/" className="flex items-center gap-1">
                            <img src="./logo-2.png" width={40} alt="Filla Logo" />
                            <span>Filla</span>
                        </a>
                    </div>
                    <nav className="flex gap-5 font-semibold max-[1024px]:hidden">
                        <a className="text-[#635a4b] no-underline transition hover:text-[#1f1c17]" href="#how-it-works">
                            How it works
                        </a>
                        <a className="text-[#635a4b] no-underline transition hover:text-[#1f1c17]" href="#why-filla">
                            Why Filla
                        </a>
                        <a className="text-[#635a4b] no-underline transition hover:text-[#1f1c17]" href="https://github.com/SidhuAchary02/filla" target="_blank" rel="noopener noreferrer">
                            Github
                        </a>
                    </nav>
                    <div className="inline-flex flex-wrap gap-3 max-[720px]:w-full">
                        {!loading && (
                            isAuthenticated ? (
                                <Link
                                    to="/dashboard"
                                    className="  bg-linear-to-br from-[#da5a2a] to-[#9e2f09] px-4 py-2.5 text-center font-bold text-white shadow-[0_8px_20px_rgba(158,47,9,0.25)] transition hover:-translate-y-0.5"
                                >
                                    Open dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="  border border-[#d9cebc] bg-[color-mix(in_srgb,white_78%,transparent)] px-4 py-2.5 text-center font-bold text-[#1f1c17] transition hover:-translate-y-0.5"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="  bg-linear-to-br from-[#da5a2a] to-[#9e2f09] px-4 py-2.5 text-center font-bold text-white shadow-[0_8px_20px_rgba(158,47,9,0.25)] transition hover:-translate-y-0.5"
                                    >
                                        Get started
                                    </Link>
                                </>
                            )
                        )}
                    </div>
                </div>
            </header>

            <main className="pt-24">
                <section
                    className="relative z-1 mx-auto w-[min(1120px,calc(100%-2rem))] scroll-mt-24 px-0 pb-12 pt-3 max-[720px]:pt-10"
                    id="start"
                >
                    <p className="text-[0.72rem] font-extrabold uppercase tracking-[-0.01em] text-[#9e2f09]">Fewer forms. More focus.</p>
                    <h1 className="mt-2 max-w-[17ch] text-[clamp(2rem,6vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.11em]">
                        Filla helps you apply to jobs without rewriting your story every time.
                    </h1>
                    <p className="mt-4 max-w-[58ch] text-[1.08rem] text-[#635a4b]">
                        Build your profile once, then use it to move through applications with confidence.
                        Filla is your application co-pilot for faster, cleaner submissions.
                    </p>
                    <div className="mt-6 inline-flex flex-wrap gap-3">
                        {!loading && (
                            isAuthenticated ? (
                                <Link
                                    to="/dashboard"
                                    className="  bg-linear-to-br from-[#da5a2a] to-[#9e2f09] px-5 py-3 text-[0.98rem] font-bold text-white shadow-[0_8px_20px_rgba(158,47,9,0.25)] transition hover:-translate-y-0.5"
                                >
                                    Open dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/signup"
                                        className="  bg-linear-to-br from-[#da5a2a] to-[#9e2f09] px-5 py-3 text-[0.98rem] font-bold text-white shadow-[0_8px_20px_rgba(158,47,9,0.25)] transition hover:-translate-y-0.5"
                                    >
                                        Create free account
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="  border border-[#d9cebc] bg-[color-mix(in_srgb,white_78%,transparent)] px-5 py-3 text-[0.98rem] font-bold text-[#1f1c17] transition hover:-translate-y-0.5"
                                    >
                                        Log in
                                    </Link>
                                </>
                            )
                        )}
                    </div>
                    <div className="mt-8 grid grid-cols-3 gap-3 max-[1024px]:grid-cols-2 max-[720px]:grid-cols-1">
                        <article className="  border border-[#d9cebc] bg-[color-mix(in_srgb,#fffdf8_88%,white)] p-4 backdrop-blur-md">
                            <strong className="block text-[1.02rem]">1 profile</strong>
                            <span className="text-[0.93rem] text-[#635a4b]">that powers every application</span>
                        </article>
                        <article className="  border border-[#d9cebc] bg-[color-mix(in_srgb,#fffdf8_88%,white)] p-4 backdrop-blur-md">
                            <strong className="block text-[1.02rem]">3 simple steps</strong>
                            <span className="text-[0.93rem] text-[#635a4b]">from setup to daily use</span>
                        </article>
                        <article className="  border border-[#d9cebc] bg-[color-mix(in_srgb,#fffdf8_88%,white)] p-4 backdrop-blur-md">
                            <strong className="block text-[1.02rem]">Less context switching</strong>
                            <span className="text-[0.93rem] text-[#635a4b]">more energy for interviews</span>
                        </article>
                    </div>
                </section>

                <section
                    className="relative z-1 mx-auto mt-4 grid w-[min(1120px,calc(100%-2rem))] scroll-mt-24 grid-cols-3 gap-3 max-[1024px]:grid-cols-2 max-[720px]:grid-cols-1"
                    id="why-filla"
                >
                    {highlights.map((item) => (
                        <article
                            className="  border border-[#d9cebc] bg-[color-mix(in_srgb,#fffdf8_88%,white)] p-[1.15rem] backdrop-blur-md"
                            key={item.title}
                        >
                            <h2 className="text-[1.1rem] font-extrabold leading-[1.2]">{item.title}</h2>
                            <p className="mt-2.5 text-[#635a4b]">{item.body}</p>
                        </article>
                    ))}
                </section>

                <section
                    className="relative z-1 mx-auto mt-14 w-[min(1120px,calc(100%-2rem))] scroll-mt-24 pb-10"
                    id="how-it-works"
                >
                    <div>
                        <p className="text-[0.72rem] font-extrabold uppercase tracking-[-0.01em] text-[#9e2f09]">How it works</p>
                        <h2 className="mt-1 max-w-[35ch] text-[clamp(1.35rem,3.8vw,2rem)] font-extrabold leading-[1.12]">
                            Designed to remove repetitive friction from your job search.
                        </h2>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-3 max-[1024px]:grid-cols-2 max-[720px]:grid-cols-1">
                        {steps.map((step) => (
                            <article
                                className="  border border-[#d9cebc] bg-[color-mix(in_srgb,#fffdf8_88%,white)] p-4 backdrop-blur-md"
                                key={step.number}
                            >
                                <span className="inline-block text-[0.78rem] font-extrabold tracking-[0.08em] text-[#da5a2a]">{step.number}</span>
                                <h3 className="mt-2 text-[1.02rem] font-extrabold">{step.title}</h3>
                                <p className="mt-2 text-[#635a4b]">{step.body}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="relative z-1 mx-auto mb-11 mt-4 w-[min(1120px,calc(100%-2rem))]   border border-[#d9cebc] bg-[color-mix(in_srgb,#fffdf8_88%,white)] p-6 backdrop-blur-md max-[720px]:mb-8">
                    <h2 className="max-w-[34ch] text-[clamp(1.18rem,3.2vw,1.65rem)] font-extrabold leading-[1.18]">
                        Ready to spend less time filling forms and more time landing interviews?
                    </h2>
                    <div className="mt-4 inline-flex flex-wrap gap-3">
                        {!loading && (
                            isAuthenticated ? (
                                <Link
                                    to="/dashboard"
                                    className="  bg-linear-to-br from-[#da5a2a] to-[#9e2f09] px-5 py-3 text-[0.98rem] font-bold text-white shadow-[0_8px_20px_rgba(158,47,9,0.25)] transition hover:-translate-y-0.5"
                                >
                                    Open dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to="/signup"
                                        className="  bg-linear-to-br from-[#da5a2a] to-[#9e2f09] px-5 py-3 text-[0.98rem] font-bold text-white shadow-[0_8px_20px_rgba(158,47,9,0.25)] transition hover:-translate-y-0.5"
                                    >
                                        Start with Filla
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="  border border-[#d9cebc] bg-[color-mix(in_srgb,white_78%,transparent)] px-5 py-3 text-[0.98rem] font-bold text-[#1f1c17] transition hover:-translate-y-0.5"
                                    >
                                        I already have an account
                                    </Link>
                                </>
                            )
                        )}
                    </div>
                </section>
            </main>
        </div>
    )
}

export default LandingPage
