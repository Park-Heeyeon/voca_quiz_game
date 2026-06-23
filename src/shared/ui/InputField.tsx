import { Input } from "./primitives/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./primitives/form";
import { Control, FieldValues, Path } from "react-hook-form";

type FieldProps<T extends FieldValues> = {
  control: Control<T>; // Control 타입 설정
  name: Path<T>; // 필드 이름
  type?: string;
  label?: string;
  placeholder?: string;
  description?: string;
  style?: string;
};

const InputField = <T extends FieldValues>({
  control,
  name,
  type = "text",
  label,
  placeholder,
  description,
  style,
}: FieldProps<T>) => {
  return (
    <FormField
      control={control} // control 속성을 직접 전달
      name={name}
      render={({ field }) => (
        <FormItem className="h-full">
          <FormLabel className="text-customDepBlueColor">{label}</FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              className={`w-full sm:w-full ${style}`} // 반응형 너비 설정
              type={type}
              {...field}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default InputField;
