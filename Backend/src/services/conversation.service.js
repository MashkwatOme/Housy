const { client } =
    require("../config/redis")

async function getConversationContext(
    sessionId
) {

    const context =
        await client.get(sessionId)

    return context
        ? JSON.parse(context)
        : {}
}

async function saveConversationContext(
    sessionId,
    context
) {

    await client.set(
        sessionId,
        JSON.stringify(context),
        "EX",
        60 * 60
    )
}

function mergeContexts(
    oldContext,
    newContext
) {

    const merged = {
        ...oldContext,

        ...Object.fromEntries(

            Object.entries(newContext)
                .filter(

                    ([_, value]) =>

                        value !== null
                        &&
                        value !== ""

                        &&
                        !(

                            Array.isArray(value)
                            &&
                            value.length === 0
                        )
                )
        )
    }

    // "where" is either a recognized area/district/division, a raw
    // unrecognized location phrase, or a nearby landmark — whichever
    // of these three is set this turn replaces the other two kinds
    // inherited from an earlier turn instead of silently stacking
    // with them.

    const placeFields =
        ["location", "locationPhrase", "nearPlace"]

    const newPlaceFieldSet =
        placeFields.some((field) => newContext[field])

    if (newPlaceFieldSet) {

        placeFields.forEach((field) => {

            if (!newContext[field]) {

                merged[field] = null
            }
        })
    }

    return merged
}

module.exports = {
    getConversationContext,
    saveConversationContext,
    mergeContexts,
}