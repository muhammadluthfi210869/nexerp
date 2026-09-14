import { Controller, Get, Post, Param, Body, Query, Req } from '@nestjs/common';
import { SampleFeesService } from './sample-fees.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateSampleFeeDto, LinkSampleFeeToDpDto } from './dto/sample-fees.dto';

@ApiTags('finance/sample-fees')
@ApiBearerAuth()
@Controller('finance/sample-fees')
export class SampleFeesController {
  constructor(private service: SampleFeesService) {}

  @Get()
  @ApiOperation({ summary: 'List sample fees (filter by customer)' })
  findAll(@Query('customerId') customerId?: string) {
    return this.service.findAll({ customerId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sample fee by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Record a new sample fee' })
  create(@Req() req: any, @Body() dto: CreateSampleFeeDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }

  @Post(':id/link-dp')
  @ApiOperation({ summary: 'Link this sample fee to a Down Payment (offset)' })
  linkDp(@Req() req: any, @Param('id') id: string, @Body() dto: LinkSampleFeeToDpDto) {
    const userId = req.user?.id;
    return this.service.linkToDownPayment(userId, id, dto.dpId);
  }

  @Post(':id/unlink-dp')
  @ApiOperation({ summary: 'Unlink this sample fee from any Down Payment' })
  unlinkDp(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    return this.service.unlinkFromDownPayment(userId, id);
  }
}
