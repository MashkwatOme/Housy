const resend = require("../config/resend")

async function sendApprovalEmail(email, name) {

    console.log("Sending approval email...")

    const data = await resend.emails.send({
        from: "EasyRent <onboarding@resend.dev>",
        to: email,
        subject: "Your EasyRent account has been approved",
        html: `
            <h2>Hello ${name}</h2>

            <p>Your EasyRent account has been approved by admin.</p>

            <p>You can now access all platform features.</p>
        `,
    })

    console.log(data)
}

module.exports = {
    sendApprovalEmail,
}