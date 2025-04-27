import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { and, desc, eq, not } from "drizzle-orm";
import { snacks } from "drizzle/schema";
import { Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { AppSidebar } from "~/components/app-sidebar";
import { DataTable } from "~/components/common/data-table";
import StockDrawerForm from "~/components/snacks/stock/stock-drawer-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { db } from "~/lib/db";
import { logSnackAction } from "~/lib/snack-history";
import { getUser } from "~/utils/auth.server";

type Snack = {
  id: number;
  name: string;
  quantity: number;
  expireDate: string;
};

const snackSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1, "간식 이름을 입력해주세요."),
    quantity: z.coerce.number().min(0, "수량은 0 이상이어야 합니다."),
    expireDate: z.string().min(1, "유통기한을 선택해주세요."),
  })
  .passthrough(); // 추가 속성 허용

function getSnackColumns(
  isAdmin: boolean,
  revalidate: () => void,
  setOpen: (open: boolean) => void,
  setInitialData: (snack: Snack) => void
): ColumnDef<Snack>[] {
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
      cell: ({ row }) => {
        const snack = row.original;

        const handleIncrement = async () => {
          try {
            const response = await fetch(`/snacks/${snack.id}/increase`, {
              method: "post",
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error(
                "수량 증가 실패:",
                errorData.error || `HTTP 에러: ${response.status}`
              );
              alert(errorData.error || `HTTP 에러: ${response.status}`);
              return;
            }

            // const data = await response.json();
            revalidate(); // 데이터 재로딩
          } catch (error) {
            console.error("수량 증가 요청 중 에러:", error);
            alert(error);
          }
        };

        const handleDecrement = async () => {
          try {
            const response = await fetch(`/snacks/${snack.id}/decrease`, {
              method: "post",
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error(
                "수량 감소 실패:",
                errorData.error || `HTTP 에러: ${response.status}`
              );
              alert(errorData.error || `HTTP 에러: ${response.status}`);
              return;
            }

            // const data = await response.json();
            revalidate(); // 데이터 재로딩
          } catch (error) {
            console.error("수량 감소 요청 중 에러:", error);
            alert(error);
          }
        };

        return (
          <div className="flex items-center gap-2">
            <span className="min-w-[24px] text-center">{snack.quantity}</span>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={handleIncrement}>
                <Plus />
                <span className="sr-only">+</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleDecrement}>
              <Minus />
              <span className="sr-only">-</span>
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "expireDate",
      header: "유통기한",
      cell: ({ getValue }) => dayjs(getValue<string>()).format("YYYY-MM-DD"),
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => {
        const snack = row.original;
        const handleDelete = async () => {
          const confirmed = window.confirm("삭제하시겠습니까?");
          if (!confirmed) return;

          const response = await fetch(`/snacks/stock/${snack.id}/delete`, {
            method: "post",
          });

          if (response.ok) {
            revalidate();
          } else {
            const error = await response.text();
            alert("삭제 실패: " + error);
          }
        };

        if (!isAdmin) return null;

        return (
          <div className="flex items-center gap-2">
            <Button
              className="bg-blue-500"
              size="sm"
              onClick={() => {
                setOpen(true);
                setInitialData(snack);
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
      },
    },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request); // 없으면 자동 redirect

  const snacksList = await db.query.snacks.findMany({
    orderBy: desc(snacks.createdAt),
  });

  return Response.json({ user, snacksList });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  const formData = await request.formData();
  const raw = Object.fromEntries(formData);
  const parsed = snackSchema.safeParse(raw);

  if (!parsed.success) {
    return Response.json(
      { success: false, errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { id, name, quantity, expireDate } = parsed.data;

  // 중복 이름 검사 (수정 시 다른 ID와 중복된 이름이면 안 됨)
  const existing = await db.query.snacks.findFirst({
    where: and(
      eq(snacks.name, name),
      id ? not(eq(snacks.id, Number(id))) : undefined
    ),
  });

  if (existing) {
    return Response.json(
      {
        success: false,
        errors: {
          name: ["이미 존재하는 간식입니다."],
        },
      },
      { status: 400 }
    );
  }

  try {
    await db.transaction(async (tx) => {
      if (id) {
        // 수정
        await tx
          .update(snacks)
          .set({
            name,
            quantity,
            expireDate,
            updatedAt: new Date(),
            updatedId: user.id,
          })
          .where(eq(snacks.id, Number(id)));

        await logSnackAction(tx, {
          snackId: Number(id),
          userId: user.id,
          action: "edit",
          quantity,
          memo: "간식 수정",
        });
      } else {
        // 추가
        const [inserted] = await tx
          .insert(snacks)
          .values({
            name,
            quantity,
            expireDate,
            createdAt: new Date(),
            createdId: user.id,
            updatedAt: new Date(),
            updatedId: user.id,
          })
          .returning({ id: snacks.id });

        await logSnackAction(tx, {
          snackId: inserted.id,
          userId: user.id,
          action: "add",
          quantity,
          memo: "간식 추가",
        });
      }
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("간식 추가/수정 실패:", error);
    return Response.json({ success: false, error: "서버 오류" }, { status: 500 });
  }
}

export default function SnacksStockPage() {
  const { user, snacksList } = useLoaderData<typeof loader>();
  const { revalidate } = useRevalidator();
  const data: Snack[] = snacksList;
  const isAdmin = user?.name === "admin";
  const [open, setOpen] = useState(false);
  const [initialData, setInitialData] = useState<Snack | undefined>(undefined);

  const columns = getSnackColumns(isAdmin, revalidate, setOpen, setInitialData);

  useEffect(() => {
    const interval = setInterval(() => {
      revalidate();
      console.log("갱신");
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
                  <BreadcrumbPage>재고 현황</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="container mx-auto px-4">
          <div className="py-4">
            {isAdmin && (
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
            )}
          </div>

          <DataTable columns={columns} data={data} />
        </div>
      </SidebarInset>

      {isAdmin && (
        <>
          <StockDrawerForm
            open={open}
            setOpen={setOpen}
            initialData={initialData}
          />
        </>
      )}
    </SidebarProvider>
  );
}
