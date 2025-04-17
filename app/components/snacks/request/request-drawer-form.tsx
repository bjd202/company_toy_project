import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { DatePicker } from "~/components/common/date-picker";
import { Button } from "~/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "~/components/ui/drawer";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

type SnackRequest = {
  id: number;
  name: string;
  quantity: number;
  reason: string;
  url: string;
  status: string;
};

type ActionResponse = {
  success: boolean;
  errors?: Record<string, string[]>;
};

export default function StockRequestDrawerForm({
  open,
  setOpen,
  initialData,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  initialData?: SnackRequest;
}) {
  const fetcher = useFetcher<ActionResponse>();

  const [formState, setFormState] = useState<SnackRequest>({
    id: 0,
    name: "",
    quantity: 0,
    reason: "",
    url: "",
    status: "",
  });

  const [errors, setErrors] = useState<Record<string, string[]> | undefined>(
    undefined
  );

  useEffect(() => {
    if (open) {
      setErrors(undefined);
      setFormState(
        initialData ?? { id: 0, name: "", quantity: 0, reason: "", url: "", status: "" }
      );
    }
  }, [open, initialData]);

  useEffect(() => {
    if (fetcher.state === "idle") {
      if (fetcher.data?.success) {
        setOpen(false);
        setErrors(undefined);
      } else if (fetcher.data?.errors) {
        setErrors(fetcher.data.errors);
      }
    }
  }, [fetcher.state, fetcher.data, setOpen]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
        <DrawerHeader className="mx-auto w-full max-w-md">
          <DrawerTitle>{formState.id ? "간식 요청 수정" : "간식 요청 추가"}</DrawerTitle>
          <DrawerDescription></DrawerDescription>
        </DrawerHeader>
        <fetcher.Form method="post">
          <Input type="hidden" name="id" value={formState.id || ""} />
          <div className="mx-auto w-full max-w-md grid items-center gap-4 p-4">
            <div className="flex flex-col space-y-2">
              <Label className="text-xl">간식 이름</Label>
              <Input
                type="text"
                name="name"
                id="name"
                value={formState.name}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              {errors?.name && (
                <p className="text-red-500 text-sm">{errors.name[0]}</p>
              )}
            </div>
            <div className="flex flex-col space-y-2">
              <Label className="text-xl">수량</Label>
              <Input
                type="number"
                name="quantity"
                id="quantity"
                value={formState.quantity}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    quantity: Number(e.target.value),
                  }))
                }
              />
              {errors?.quantity && (
                <p className="text-red-500 text-sm">{errors.quantity[0]}</p>
              )}
            </div>
            <div className="flex flex-col space-y-2">
              <Label className="text-xl">요청 사유</Label>
              <Input
                type="text"
                name="reason"
                id="reason"
                value={formState.reason}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, reason: e.target.value }))
                }
              />
              {errors?.reason && (
                <p className="text-red-500 text-sm">{errors.reason[0]}</p>
              )}
            </div>
            <div className="flex flex-col space-y-2">
              <Label className="text-xl">URL</Label>
              <Input
                type="text"
                name="url"
                id="url"
                value={formState.url}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, url: e.target.value }))
                }
              />
              {errors?.url && (
                <p className="text-red-500 text-sm">{errors.url[0]}</p>
              )}
            </div>
          </div>

          <DrawerFooter className="w-full max-w-md mx-auto">
            <Button type="submit">저장</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
          </DrawerFooter>
        </fetcher.Form>
      </DrawerContent>
    </Drawer>
  );
}
