export const parseFoodResponse = (text: string) => {
  const clean = text.replace(/```json|```/g, "").trim();

  return JSON.parse(clean);
};
