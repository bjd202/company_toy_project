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

export type Snack = {
  id: number;
  name: string;
  quantity: number;
  expireDate: string;
};

type ActionResponse = {
  success: boolean;
  errors?: Record<string, string[]>;
};

export default function StockDrawerForm({
  open,
  setOpen,
  initialData,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  initialData?: Snack;
}) {
  const fetcher = useFetcher<ActionResponse>();

  const [formState, setFormState] = useState<Snack>({
    id: 0,
    name: "",
    quantity: 0,
    expireDate: "",
  });

  const [expireDate, setExpireDate] = useState<Date | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string[]> | undefined>(
    undefined
  );

  useEffect(() => {
    if (open) {
      setErrors(undefined);
      setFormState(
        initialData ?? { id: 0, name: "", quantity: 0, expireDate: "" }
      );
      setExpireDate(
        initialData?.expireDate ? new Date(initialData.expireDate) : undefined
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
          <DrawerTitle>{formState.id ? "간식 수정" : "간식 추가"}</DrawerTitle>
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
              <Label className="text-xl">유통기한</Label>
              <DatePicker
                name="expireDate"
                value={expireDate}
                onChange={setExpireDate}
              />
              {errors?.expireDate && (
                <p className="text-red-500 text-sm">{errors.expireDate[0]}</p>
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
