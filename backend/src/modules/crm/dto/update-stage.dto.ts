import { IsEnum } from "class-validator";
import { CrmStage } from "@prisma/client";

export class UpdateStageDto {
  @IsEnum(CrmStage, {
    message: `stage must be one of: ${Object.values(CrmStage).join(", ")}`,
  })
  stage!: CrmStage;
}
