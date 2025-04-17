import { Separator } from "@radix-ui/react-separator";
import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { ColumnDef } from "@tanstack/react-table";
import { desc, eq } from "drizzle-orm";
import { snackRequests, users } from "drizzle/schema";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { AppSidebar } from "~/components/app-sidebar";
import { DataTable } from "~/components/common/data-table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { db } from "~/lib/db";
import { getUser } from "~/utils/auth.server";

type SnackRequest = {
  id: number;
  name: string;
  quantity: number;
  reason: string;
  createdId: string;
  status: string;
};

const getSnackRequestsColumns = (
  isAdmin: boolean,
  revalidate: () => void
): ColumnDef<SnackRequest>[] => {
  return [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "name",
      header: "간식 이름",
    },
    {
      accessorKey: "quantity",
      header: "수량",
    },
    {
      accessorKey: "reason",
      header: "요청 사유",
    },
    {
      accessorKey: "url",
      header: "URL",
      cell: ({ getValue }) => {
        const url = getValue<string>();

        return (
          <div className="truncate max-w-[200px]">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={url}
              className="text-blue-600 underline hover:text-blue-800"
            >
              {url}
            </a>
          </div>
        );
      },
    },
    {
      accessorKey: "username",
      header: "요청자",
    },
    {
      accessorKey: "actions",
      header: "상태",
      cell: ({ row }) => {
        const { status, id, name, quantity, reason, url, createdId } = row.original;
      
        const handleApproved = async () => {
          if (!isAdmin || status === "approved") return;
      
          const res = await fetch(`/snacks/request/${id}/approved`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ id, name, quantity, reason, url, createdId }),
          });
      
          if (!res.ok) {
            const error = await res.json();
            alert(error.error);
            return;
          }
      
          revalidate(); // 최신 상태 반영
        };
      
        const handleRejected = async () => {
          if (!isAdmin || status === "rejected" || status === "approved") return;
      
          const res = await fetch(`/snacks/request/${id}/rejected`, {
            method: "POST",
          });
      
          if (!res.ok) {
            const error = await res.json();
            alert(error.error);
            return;
          }
      
          revalidate(); // 최신 상태 반영
        };
      
        return (
          <div className="flex items-center gap-2">
            <Button
              className={
                status === "pending"
                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  : ""
              }
              variant={status === "pending" ? "default" : "outline"}
            >
              요청
            </Button>
            <Button
              className={
                status === "approved"
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : ""
              }
              variant={status === "approved" ? "default" : "outline"}
              onClick={handleApproved}
            >
              승인
            </Button>
            <Button
              className={
                status === "rejected"
                  ? "bg-red-100 text-red-800 hover:bg-red-200"
                  : ""
              }
              variant={status === "rejected" ? "default" : "outline"}
              onClick={handleRejected}
            >
              거절
            </Button>
          </div>
        );
      },
      
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request); // 없으면 자동 redirect

  const snackRequestsList = await db
    .select({
      id: snackRequests.id,
      name: snackRequests.name,
      quantity: snackRequests.quantity,
      reason: snackRequests.reason,
      url: snackRequests.url,
      status: snackRequests.status,
      createdAt: snackRequests.createdAt,
      createdId: snackRequests.createdId,
      username: users.username,
    })
    .from(snackRequests)
    .leftJoin(users, eq(snackRequests.createdId, users.id))
    .orderBy(desc(snackRequests.createdAt));

  return Response.json({ user, snackRequestsList });
}

export default function SnacksRequestPage() {
  const { revalidate } = useRevalidator();

  const { user, snackRequestsList } = useLoaderData<typeof loader>();
  const data = snackRequestsList;

  const isAdmin = user?.name === "admin";
  const [open, setOpen] = useState(false);
  const [initialData, setInitialData] = useState<Snack | undefined>(undefined);
  const columns = getSnackRequestsColumns(isAdmin, revalidate);

  useEffect(() => {
    const interval = setInterval(() => {
      revalidate();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [revalidate]);

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">간식</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>간식 요청</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="container mx-auto px-4">
          <div className="py-4">
            <Button
              className="ml-auto"
              size={"sm"}
              onClick={() => {
                setOpen(!open);
                setInitialData(undefined);
              }}
            >
              <Plus />
              추가
            </Button>
          </div>

          <DataTable columns={columns} data={data} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
