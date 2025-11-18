import { ShippingService } from "../services/shipping.service";

const test = async () => {
  try {
    const cost = await ShippingService.calculateShippingCost("Fr", 2);
    console.table(cost);
  } catch (err) {
    console.log(err);
  }
};
test();