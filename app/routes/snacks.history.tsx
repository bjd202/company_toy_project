import { Separator } from "@radix-ui/react-separator";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useLocation, useRevalidator } from "@remix-run/react";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { snackHistories, snacks, users } from "drizzle/schema";
import { useEffect, useState } from "react";
import { AppSidebar } from "~/components/app-sidebar";
import { DataTable } from "~/components/common/data-table";
import { DatePicker } from "~/components/common/date-picker";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { db } from "~/lib/db";
import { getUser } from "~/utils/auth.server";

type SnackHistory = {
  id: number;
  name: string;
  action: "add" | "edit" | "delete" | "approved" | "rejected" | "increase" | "decrease";
  quantity?: number;
  username: string;
  createdAt: Date;
  memo?: string;
};


const getSnackHistoryColumns = (): ColumnDef<SnackHistory>[] => {
  return [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "createdAt",
      header: "변경일자",
      cell: ({ getValue }) => dayjs(getValue<string>()).format("YYYY-MM-DD HH:mm"),
    },
    {
      accessorKey: "action",
      header: "작업",
      cell: ({ getValue }) => {
        const action = getValue<string>();

        const labelMap: Record<string, string> = {
          add: "추가",
          edit: "수정",
          delete: "삭제",
          approved: "승인",
          rejected: "거절",
          increase: "수량 증가",
          decrease: "수량 감소",
        };
    
        const colorMap: Record<string, string> = {
          add: "text-green-600",
          edit: "text-blue-600",
          delete: "text-red-600",
          approved: "text-green-800",
          rejected: "text-red-800",
          increase: "text-green-500",
          decrease: "text-red-500",
        };
        
        return (
          <span className={colorMap[action]}>
            {labelMap[action] ?? action}
          </span>
        );
      },
    },
    {
      accessorKey: "name",
      header: "간식 이름",
    },
    {
      accessorKey: "quantity",
      header: "수량 변화",
      cell: ({ row }) => {
        const action = row.original.action;
        const quantity = row.original.quantity;
        if (quantity == null) return "-";
    
        const sign = action === "increase" || action === "add" || action === "approved" ? "+" :
                     action === "decrease" ? "-" : "";
        return <span>{sign}{quantity}</span>;
      }
    },
    {
      accessorKey: "username",
      header: "작업자",
    },
    {
      accessorKey: "memo",
      header: "메모",
      cell: ({ getValue }) => {
        const memo = getValue<string>();
        return memo ? <span title={memo}>{memo}</span> : "-";
      },
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const whereConditions = [];

  if (from) {
    whereConditions.push(gte(snackHistories.createdAt, new Date(from)));
  }
  if (to) {
    whereConditions.push(lte(snackHistories.createdAt, new Date(to)));
  }

  const snackHistoryList = await db
    .select({
      id: snackHistories.id,
      name: snacks.name,
      username: users.username,
      action: snackHistories.action,
      quantity: snackHistories.quantity,
      createdAt: snackHistories.createdAt,
      memo: snackHistories.memo,
    })
    .from(snackHistories)
    .leftJoin(snacks, eq(snackHistories.snackId, snacks.id))
    .leftJoin(users, eq(snackHistories.userId, users.id))
    .where(whereConditions.length ? and(...whereConditions) : undefined)
    .orderBy(desc(snackHistories.id));

  return Response.json({ user, snackHistoryList });
}


export default function SnacksHistoryPage() {
  const { revalidate } = useRevalidator();

  const {user, snackHistoryList} = useLoaderData<typeof loader>();
  const data = snackHistoryList;

  const columns = getSnackHistoryColumns();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialFrom = searchParams.get("from");
  const initialTo = searchParams.get("to");

  const [fromDate, setFromDate] = useState(initialFrom ? new Date(initialFrom) : undefined);
  const [toDate, setToDate] = useState(initialTo ? new Date(initialTo) : undefined);


  const filteredData = data;

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
                  <BreadcrumbPage>간식 이력</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="container mx-auto px-4">
        <Form method="get" className="mb-4 flex gap-2 w-fit items-center">
          <DatePicker name="from" value={fromDate} onChange={setFromDate} />
          <span>~</span>
          <DatePicker name="to" value={toDate} onChange={setToDate} />
          <Button type="submit" size="sm" className="ml-2">조회</Button>
        </Form>

          <DataTable columns={columns} data={filteredData} />
        </div>

      </SidebarInset>
    </SidebarProvider>
  );
}
