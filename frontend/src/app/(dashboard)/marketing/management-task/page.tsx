import { ManagementTaskClient } from "./ManagementTaskClient";

type ManagementTaskPageProps = {
  searchParams?: Promise<{
    tab?: string;
  }>;
};

export default async function ManagementTaskPage({ searchParams }: ManagementTaskPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};

  return <ManagementTaskClient initialTab={resolvedSearchParams.tab ?? "overview"} />;
}
