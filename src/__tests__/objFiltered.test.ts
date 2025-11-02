import { buildRelationsFilter, objFiltered } from "../utils/filter";
describe("teste objFiltered returner les donne qui changes de meme champs", () => {
  // it("retourne les champs identiques entre oldObj et newObj", () => {
  //   const oldObj = { name: "Miel", price: 20 };
  //   const newObj = { name: "Miel", price: 25 };
  //   const result = objFiltered(oldObj, newObj);
  //   expect(result).toEqual({ price: 25 });
  // });
  // it("retourne newObj ", () => {
  //   const oldObj = { name: "Miel", price: 20 };
  //   const newObj = { name: "Thym", price: 25 };
  //   const result = objFiltered(oldObj, newObj);

  //   expect(result).toEqual({ name: "Thym", price: 25 });
  // });
  // it("retourne vide si rien ne correspond", () => {
  //   const oldObj = { name: "Miel", price: 20 };
  //   const newObj = { name: "Miel" };
  //   const result = objFiltered(oldObj, newObj);

  //   expect(result).toEqual({});
  // });
  //  it("retourne vide si rien ne correspond", () => {
  //   const oldObj = { name: "Miel" };
  //   const newObj = { name: "Miel", price: 20 };
  //   const result = objFiltered(oldObj, newObj);
  //   console.log(result, "result");
  //   expect(result).toEqual({});
  // });
  
  // it("retourne vide si rien ne correspond", () => {
  //   const oldObj = { name: "Miel" };
  //   const newObj = { slug: "miel-bio" } as any;
  //   const result = objFiltered(oldObj, newObj);

  //   expect(result).toEqual({});
  // });
   it("retourne isActive si changer", () => {
    const oldObj = { name: "Miel", isActive: false };
    const newObj = {  isActive: true } as any;
    const result = objFiltered(oldObj, newObj);

    expect(result).toEqual({isActive: true});
  });
  // it("", () => {
  //   const oldObj = {
  //     id: "0023258f-2c6d-4d2b-8f76-d5c46bb04408",
  //     name: "OLDKJFS",
  //     image:
  //       "https://res.cloudinary.com/dje0moqah/image/upload/v1759322781/categories/ctgjkbfvuquz1uztynrv.jpg",
  //     publicId: "categories/ctgjkbfvuquz1uztynrv",
  //     description: "ODSFKSLK",
  //     isActive: false,
  //     slug: "oldkjfs",
  //   };
  //   const newObj = { isActive: true }
  //   expect(objFiltered(oldObj, newObj)).toEqual({ isActive: true });
  // });
  // it("should build filter for a single relation (with)", () => {
  //   const filter = buildRelationsFilter([
  //     {
  //       relation: "variants",
  //       mode: "with",
  //       nested: { price: { gte: 10 } },
  //     },
  //     { relation: "category", mode: "without"},
  //   ]);
  //   console.log(filter, "filter");
  //   expect(filter).toEqual({
  //     variants: { some: { price: { gte: 10 } } },
  //     category: { none: {  } },
  //   });
  // });
});
