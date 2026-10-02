// Baileys 7: participant.id may be PN or LID depending on the group's addressing mode,
// so return every known id of each admin (id + phoneNumber + lid).
const getGroupAdmins = (participants) => {
	return participants
		?.filter((i) => i.admin === "admin" || i.admin === "superadmin")
		.flatMap((i) => [i.id, i.phoneNumber, i.lid])
		.filter(Boolean);
};

export default getGroupAdmins;
