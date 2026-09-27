import { PATH_METADATA } from '@nestjs/common/constants';
import { SuppliersController } from '../../src/modules/master/controllers/suppliers.controller';
import { CustomersController } from '../../src/modules/master/controllers/customers.controller';
import { MaterialsController } from '../../src/modules/master/controllers/materials.controller';

// Express matches routes in declaration order, so `@Get('active')` has to be declared before
// `@Get(':id')`. When it is not, GET /master/suppliers/active and /master/customers/active —
// the first call SupplierSelect and CustomerSelect make on every open — land on findOne('active')
// instead and fail with "invalid input syntax for type uuid" as an HTTP 500.
//
// Order is the entire invariant, so that is what this asserts. It reads the handlers off the
// prototype, whose own-property order is definition order.
function routeDeclarationIndex(controller: any): Array<[string, string]> {
  return Object.getOwnPropertyNames(controller.prototype)
    .map((name): [string, string] => [
      name,
      Reflect.getMetadata(PATH_METADATA, controller.prototype[name]),
    ])
    .filter(([, routePath]) => typeof routePath === 'string');
}

describe('Master dropdown routes precede :id', () => {
  const cases: Array<[string, any]> = [
    ['SuppliersController', SuppliersController],
    ['CustomersController', CustomersController],
    ['MaterialsController', MaterialsController],
  ];

  it.each(cases)('%s declares "active" before ":id"', (_name, controller) => {
    const routes = routeDeclarationIndex(controller);
    const activeIdx = routes.findIndex(([, p]) => p === 'active');
    const idIdx = routes.findIndex(([, p]) => p === ':id');

    expect(activeIdx).toBeGreaterThanOrEqual(0);
    expect(idIdx).toBeGreaterThanOrEqual(0);
    expect(activeIdx).toBeLessThan(idIdx);
  });
});
