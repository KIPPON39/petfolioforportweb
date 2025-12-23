// types
export type PetType = "dog" | "cat" | "bird" | "fish" | "rabbit" | "hamster";

export type AddPetForm = {
  name: string;
  type: PetType;
  breed?: string;
  medicalConditions?: string;
  weight?: string;
};

// service
export const addPetService = async (
  form: AddPetForm,
  token: string,
  userId: string
) => {
  const newPet = {
    ...form,
    weight: form.weight || "",
    ownerId: userId,
  };

  const res = await fetch("https://api.petfolio.wisitdev.com/api/pets", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(newPet),
  });

  if (!res.ok) throw new Error("Failed to add pet");

  return await res.json() as {
    _id: string;
    name: string;
    type: PetType;
    breed?: string;
    medicalConditions?: string;
    weight?: string;
    ownerId: string;
  };
};
