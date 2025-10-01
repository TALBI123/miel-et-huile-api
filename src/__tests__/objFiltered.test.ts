import { objFiltered } from "../utils/filter";
describe("teste objFiltered returner les donne qui changes de meme champs", () => {
  it("retourne les champs identiques entre oldObj et newObj", () => {
    const oldObj = { name: "Miel", price: 20 };
    const newObj = { name: "Miel", price: 25 };
    const result = objFiltered(oldObj, newObj);
    expect(result).toEqual({ price: 25 });
  });
  it("retourne newObj ", () => {
    const oldObj = { name: "Miel", price: 20 };
    const newObj = { name: "Thym", price: 25 };
    const result = objFiltered(oldObj, newObj);

    expect(result).toEqual({ name: "Thym", price: 25 });
  });
  it("retourne vide si rien ne correspond", () => {
    const oldObj = { name: "Miel", price: 20 };
    const newObj = { name: "Miel" };
    const result = objFiltered(oldObj, newObj);

    expect(result).toEqual({});
  });
   it("retourne vide si rien ne correspond", () => {
    const oldObj = { name: "Miel" };
    const newObj = { name: "Miel", price: 20 };
    const result = objFiltered(oldObj, newObj);

    expect(result).toEqual({});
  });
  it("retourne vide si rien ne correspond", () => {
    const oldObj = { name: "Miel" };
    const newObj = { slug: "miel-bio" } as any;
    const result = objFiltered(oldObj, newObj);

    expect(result).toEqual({});
  });

});
