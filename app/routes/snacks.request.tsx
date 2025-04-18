import { Separator } from "@radix-ui/react-separator";
import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { ColumnDef } from "@tanstack/react-table";
import { desc, eq } from "drizzle-orm";
import { snackRequests, users } from "drizzle/schema";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { AppSidebar } from "~/components/app-sidebar";
import { DataTable } from "~/components/common/data-table";
import StockRequestDrawerForm from "~/components/snacks/request/request-drawer-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
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
  url: string;
  createdId: string;
  status: string;
};

const snackRequestSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "간식 이름을 입력해주세요."),
    quantity: z.coerce.number().min(0, "수량은 0 이상이어야 합니다."),
    reason: z.string(),
    url: z.string(),
  });

const getSnackRequestsColumns = (
  isAdmin: boolean,
  userId: string,
  revalidate: () => void,
  setOpen: (open: boolean) => void,
  setInitialData: (snackRequest: SnackRequest) => void
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
      accessorKey: "status",
      header: "상태",
      cell: ({ row }) => {
        const snackRequest = row.original;
      
        const handleApproved = async () => {
          if (!isAdmin || snackRequest.status === "approved") return;
      
          debugger;
          const res = await fetch(`/snacks/request/${snackRequest.id}/approved`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(snackRequest),
          });
      
          if (!res.ok) {
            const error = await res.json();
            alert(error.error);
            return;
          }
      
          revalidate(); // 최신 상태 반영
        };
      
        const handleRejected = async () => {
          if (!isAdmin || snackRequest.status === "rejected" || snackRequest.status === "approved") return;
      
          const res = await fetch(`/snacks/request/${snackRequest.id}/rejected`, {
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
                snackRequest.status === "pending"
                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  : ""
              }
              variant={snackRequest.status === "pending" ? "default" : "outline"}
            >
              요청
            </Button>
            <Button
              className={
                snackRequest.status === "approved"
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : ""
              }
              variant={snackRequest.status === "approved" ? "default" : "outline"}
              onClick={handleApproved}
            >
              승인
            </Button>
            <Button
              className={
                snackRequest.status === "rejected"
                  ? "bg-red-100 text-red-800 hover:bg-red-200"
                  : ""
              }
              variant={snackRequest.status === "rejected" ? "default" : "outline"}
              onClick={handleRejected}
            >
              거절
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({row}) => {
        const snackRequest = row.original;

        const handleDelete = async () => {
          if(!isAdmin || snackRequest.createdId !== userId){
            alert("요청자가 다릅니다.");
            return;
          }

          if(!confirm("삭제하시겠습니까?")) return;

          const res = await fetch(`/snacks/request/${snackRequest.id}/delete`, {
            method: "post",
          });

          if (!res.ok) {
            const error = await res.json();
            alert(error.error);
            return;
          }
      
          revalidate(); // 최신 상태 반영
        }

        return (
          <div className="flex items-center gap-2">
            <Button
              className="bg-blue-500"
              size="sm"
              onClick={() => {
                setOpen(true);
                setInitialData(snackRequest);
              }}
            >
              <Pencil />
              <span className="sr-only">수정</span>
            </Button>
            <Button className="bg-red-500" size="sm" onClick={handleDelete}>
              <Trash2 />
              <span className="sr-only">삭제</span>
            </Button>
          </div>
        );
      }
    },
  ];
};

export async function action({request}: ActionFunctionArgs) {
  const user = await getUser(request);
  const formData = await request.formData();
  const raw = Object.fromEntries(formData);
  const parsed = snackRequestSchema.safeParse(raw);

  if (!parsed.success) {
    return Response.json(
      { success: false, errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const {id, name, quantity, reason, url} = parsed.data;

  try {
    if (id) {
      await db
      .update(snackRequests)
      .set({
        name,
        quantity,
        reason,
        url,
        status: "pending",
        updatedAt: new Date(),
      })
      .where(eq(snackRequests.id, Number(id)));
    }else{
      await db
      .insert(snackRequests).values({
        name,
        quantity,
        reason,
        url,
        createdAt: new Date(),
        createdId: user.id,
        updatedAt: new Date(),
        status: "pending",
      })
    }

    return Response.json({success: true});
  } catch (error) {
    alert("서버 에러");
    return Response.json({success: false, error: "서버 에러"}, 
      {status: 500,})
  }
}

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
    .orderBy(desc(snackRequests.id));

  return Response.json({ user, snackRequestsList });
}

export default function SnacksRequestPage() {
  const { revalidate } = useRevalidator();

  const { user, snackRequestsList } = useLoaderData<typeof loader>();
  const data = snackRequestsList;

  const isAdmin = user?.name === "admin";
  const userId = user?.id;
  const [open, setOpen] = useState(false);
  const [initialData, setInitialData] = useState<SnackRequest | undefined>(undefined);
  const columns = getSnackRequestsColumns(isAdmin, userId, revalidate, setOpen, setInitialData);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredData = useMemo(() => {
    if (statusFilter === "all") return data;
    return data.filter((item: SnackRequest) => item.status === statusFilter);
  }, [data, statusFilter]);
  

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

          <div className="mb-4 flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="pending">요청</SelectItem>
                <SelectItem value="approved">승인</SelectItem>
                <SelectItem value="rejected">거절</SelectItem>
              </SelectContent>
            </Select>
          </div>


          <DataTable columns={columns} data={filteredData} />
        </div>

        <StockRequestDrawerForm
          open={open}
          setOpen={setOpen}
          initialData={initialData}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
