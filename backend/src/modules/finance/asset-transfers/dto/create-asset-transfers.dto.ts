import { ApiProperty } from '@nestjs/swagger';

export class CreateAssetTransfersDto {
  @ApiProperty({ example: "uuid" })
  id: string;

  @ApiProperty({ example: "uuid" })
  assetId: string;

  @ApiProperty({ example: "2026-09-08" })
  transferDate: string;

  @ApiProperty({ example: "Gudang A" })
  fromLocation: string;

  @ApiProperty({ example: "Gudang B" })
  toLocation: string;

  @ApiProperty({ example: "John Doe" })
  fromPerson: string;

  @ApiProperty({ example: "Jane Doe" })
  toPerson: string;
}
