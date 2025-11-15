 async function allWithErrors(promises) {
  const results = await Promise.allSettled(promises);
  const fulfilled = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);
  const rejected = results
    .filter((r) => r.status === "rejected")
    .map((r) => r.reason);
  if (rejected.length > 0) {
    const error = new Error("Une ou plusieurs promesses ont échoué");
    error.fulfilled = fulfilled;
    error.rejected = rejected;
    throw error;
  }
  return fulfilled;
}

const func = async () => {
  let results = [];
  try {
    results = await allWithErrors([
      Promise.resolve(1),
      Promise.resolve(2),
      Promise.reject("err"),
      Promise.resolve(4),
    ]);
    console.log("Success:", results);
  } catch (e) {
      console.log("Error:", e, "`\n Results : ", results);
      console.log("Succ-error:", e.fulfilled.join(", "));
  }
};
func();
