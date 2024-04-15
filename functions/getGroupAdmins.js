const getGroupAdmins = (participants) => {
    return participants.filter((i) => i.admin === "admin" ||
        i.admin === "superadmin").map((i) => i.id);
}
module.exports = getGroupAdmins;