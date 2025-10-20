"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  fetchRiskAssessments,
  type RiskAssessmentListItem,
} from "@/lib/api/risk-justification";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, Filter, RefreshCcw } from "lucide-react";

const columns = [
  {
    header: "Score",
    accessorKey: "riskScore",
    sortable: true,
    cell: ({ row }: { row: { original: RiskAssessmentListItem } }) => (
      <span className="font-semibold">{row.original.riskScore}</span>
    ),
  },
  {
    header: "Decision",
    accessorKey: "decision",
    sortable: true,
    cell: ({ row }: { row: { original: RiskAssessmentListItem } }) => {
      const d = row.original.decision;
      const variant =
        d === "deny" ? "destructive" : d === "warn" ? "secondary" : "default";
      return <Badge variant={variant as any}>{d.toUpperCase()}</Badge>;
    },
  },
  {
    header: "User",
    accessorKey: "userName",
    sortable: true,
    cell: ({ row }: { row: { original: RiskAssessmentListItem } }) => {
      const user = row.original;
      if (!user.userName && !user.userEmail && !user.username) {
        return <span className="text-muted-foreground">Guest</span>;
      }
      const fullName = [user.userName, user.userLastName]
        .filter(Boolean)
        .join(" ");
      const displayName = fullName || user.username || "Unknown";
      return (
        <div className="flex flex-col">
          <span className="font-medium">{displayName}</span>
          {user.userEmail && (
            <span className="text-muted-foreground text-xs">
              {user.userEmail}
            </span>
          )}
        </div>
      );
    },
  },
  {
    header: "Confidence",
    accessorKey: "confidence",
    sortable: true,
    cell: ({ row }: { row: { original: RiskAssessmentListItem } }) => (
      <span>{row.original.confidence}%</span>
    ),
  },
  {
    header: "Amount",
    accessorKey: "transactionAmount",
    sortable: true,
    cell: ({ row }: { row: { original: RiskAssessmentListItem } }) => (
      <span>${(row.original.transactionAmount / 100).toFixed(2)}</span>
    ),
  },
  {
    header: "IP",
    accessorKey: "ipAddress",
    sortable: true,
  },
  {
    header: "Created",
    accessorKey: "createdAt",
    sortable: true,
    cell: ({ row }: { row: { original: RiskAssessmentListItem } }) => (
      <span>{new Date(row.original.createdAt).toLocaleString()}</span>
    ),
  },
  {
    header: "Actions",
    cell: ({ row }: { row: { original: RiskAssessmentListItem } }) => (
      <div className="flex gap-2">
        <Link href={`/admin/risk-assessments/${row.original.id}`}>
          <Button variant="ghost" size="sm">
            View
          </Button>
        </Link>
      </div>
    ),
  },
];

export default function RiskAssessmentsPage() {
  const session = useSession();
  const storeId = session?.data?.store?.id;

  const [search, setSearch] = useState("");
  const [onlyWarn, setOnlyWarn] = useState(true);
  const [onlyDeny, setOnlyDeny] = useState(true);
  const [showAllStores, setShowAllStores] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const decisions = useMemo(() => {
    const arr: Array<"warn" | "deny"> = [];
    if (onlyWarn) arr.push("warn");
    if (onlyDeny) arr.push("deny");
    return arr.length ? arr : ["warn", "deny"];
  }, [onlyWarn, onlyDeny]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: [
      "risk-assessments",
      {
        storeId: showAllStores ? undefined : storeId,
        search,
        decisions,
        sortBy,
        sortOrder,
      },
    ],
    queryFn: () => {
      console.log("🔍 Frontend: Fetching with decisions:", decisions);
      return fetchRiskAssessments({
        storeId: showAllStores ? undefined : storeId,
        search: search || undefined,
        decision: decisions,
        page: 1,
        limit: 50,
        sortBy,
        sortOrder,
      });
    },
  });

  const assessments = data?.assessments ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Risk Assessments</h1>
          <p className="text-muted-foreground">
            Manage AI justifications for warn/deny transactions
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Scope to your store or all (admins)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="relative max-w-sm min-w-[220px] flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder="Search by user or IP..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={onlyWarn ? "default" : "outline"}
                size="sm"
                onClick={() => setOnlyWarn((v) => !v)}
              >
                <Filter className="mr-2 h-4 w-4" /> Warn
              </Button>
              <Button
                variant={onlyDeny ? "default" : "outline"}
                size="sm"
                onClick={() => setOnlyDeny((v) => !v)}
              >
                <Filter className="mr-2 h-4 w-4" /> Deny
              </Button>
              <Button
                variant={showAllStores ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAllStores((v) => !v)}
              >
                All Stores
              </Button>
            </div>
          </div>
          <div>
            {isLoading ? (
              <div className="text-muted-foreground text-sm">
                Loading assessments…
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={assessments}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
