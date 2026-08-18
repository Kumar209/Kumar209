const fs = require("fs");

const USERNAME = "Kumar209";
const OUTPUT_FILE = "github-stats.svg";

const GITHUB_GRAPHQL_URL =
  "https://api.github.com/graphql";


// ============================================================
// MAIN
// ============================================================

async function main() {
  const token = process.env.GH_PROFILE_TOKEN;

  if (!token) {
    throw new Error(
      "GH_PROFILE_TOKEN environment variable is missing."
    );
  }

  console.log(
    `Fetching GitHub data for ${USERNAME}...`
  );

  const user = await fetchGitHubData(token);

  const svg = generateSVG(user);

  fs.writeFileSync(
    OUTPUT_FILE,
    svg,
    "utf8"
  );

  console.log(
    `Generated ${OUTPUT_FILE}`
  );
}


// ============================================================
// GITHUB GRAPHQL
// ============================================================

async function fetchGitHubData(token) {
  const query = `
    query($username: String!) {

      user(login: $username) {

        login

        name

        followers {
          totalCount
        }

        following {
          totalCount
        }

        repositories(
          ownerAffiliations: OWNER
          first: 100
          privacy: PUBLIC
        ) {

          totalCount

          nodes {

            name

            stargazerCount

            primaryLanguage {
              name
            }

          }
        }

        contributionsCollection {

          totalCommitContributions

          totalIssueContributions

          totalPullRequestContributions

          totalPullRequestReviewContributions

          contributionCalendar {

            totalContributions

            weeks {

              contributionDays {

                contributionCount

                contributionLevel

                color

                date

                weekday

              }

            }

          }

        }

      }

    }
  `;

  const response = await fetch(
    GITHUB_GRAPHQL_URL,
    {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent":
          "Kumar209-GitHub-Stats",
      },

      body: JSON.stringify({
        query,

        variables: {
          username: USERNAME,
        },

      }),

    }
  );

  if (!response.ok) {
    throw new Error(
      `GitHub API returned HTTP ${response.status}`
    );
  }

  const result =
    await response.json();

  if (result.errors) {

    console.error(
      result.errors
    );

    throw new Error(
      result.errors[0]?.message ||
        "GitHub GraphQL request failed."
    );

  }

  if (!result.data?.user) {

    throw new Error(
      `GitHub user "${USERNAME}" was not found.`
    );

  }

  return result.data.user;
}


// ============================================================
// GENERATE SVG
// ============================================================

function generateSVG(user) {

  const contributions =
    user.contributionsCollection
      .contributionCalendar
      .totalContributions;

  const commits =
    user.contributionsCollection
      .totalCommitContributions;

  const pullRequests =
    user.contributionsCollection
      .totalPullRequestContributions;

  const issues =
    user.contributionsCollection
      .totalIssueContributions;

  const reviews =
    user.contributionsCollection
      .totalPullRequestReviewContributions;

  const repositories =
    user.repositories.totalCount;

  const followers =
    user.followers.totalCount;

  const following =
    user.following.totalCount;

  const stars =
    user.repositories.nodes.reduce(
      (total, repository) =>
        total +
        repository.stargazerCount,
      0
    );

  const languages =
    getTopLanguages(
      user.repositories.nodes
    );

  return `
<svg
  xmlns="http://www.w3.org/2000/svg"
  width="1000"
  height="500"
  viewBox="0 0 1000 500"
>

  <!-- ====================================================== -->
  <!-- DEFINITIONS -->
  <!-- ====================================================== -->

  <defs>

    <linearGradient
      id="accent"
      x1="0%"
      y1="0%"
      x2="100%"
      y2="0%"
    >

      <stop
        offset="0%"
        stop-color="#7c3aed"
      />

      <stop
        offset="100%"
        stop-color="#2563eb"
      />

    </linearGradient>


    <linearGradient
      id="barGradient"
      x1="0%"
      y1="0%"
      x2="100%"
      y2="0%"
    >

      <stop
        offset="0%"
        stop-color="#7c3aed"
      />

      <stop
        offset="100%"
        stop-color="#3b82f6"
      />

    </linearGradient>

  </defs>


  <!-- ====================================================== -->
  <!-- CARD -->
  <!-- ====================================================== -->

  <rect
    width="1000"
    height="500"
    rx="22"
    fill="#0d1117"
    stroke="#30363d"
    stroke-width="1"
  />


  <!-- ====================================================== -->
  <!-- TOP ACCENT -->
  <!-- ====================================================== -->

  <rect
    x="0"
    y="0"
    width="1000"
    height="6"
    rx="3"
    fill="url(#accent)"
  />


  <!-- ====================================================== -->
  <!-- DEVELOPER SNAPSHOT -->
  <!-- ====================================================== -->

  <text
    x="45"
    y="52"
    fill="#ffffff"
    font-size="25"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="700"
  >
    Developer Snapshot
  </text>


  <text
    x="45"
    y="78"
    fill="#8b949e"
    font-size="15"
    font-family="Arial, Helvetica, sans-serif"
  >
    Full Stack .NET Developer • C# • ASP.NET Core • Angular • React
  </text>


  <!-- ====================================================== -->
  <!-- MAIN STAT CARDS -->
  <!-- ====================================================== -->

  ${statCard(
    45,
    105,
    "Repositories",
    repositories
  )}

  ${statCard(
    255,
    105,
    "Followers",
    followers
  )}

  ${statCard(
    465,
    105,
    "Stars",
    stars
  )}

  ${statCard(
    675,
    105,
    "Contributions",
    contributions
  )}


  <!-- ====================================================== -->
  <!-- ACTIVITY SUMMARY -->
  <!-- ====================================================== -->

  ${secondaryStat(
    45,
    "COMMITS",
    commits
  )}

  ${secondaryStat(
    210,
    "PULL REQUESTS",
    pullRequests
  )}

  ${secondaryStat(
    405,
    "ISSUES",
    issues
  )}

  ${secondaryStat(
    550,
    "PR REVIEWS",
    reviews
  )}

  ${secondaryStat(
    730,
    "FOLLOWING",
    following
  )}


  <!-- ====================================================== -->
  <!-- TECHNOLOGIES -->
  <!-- ====================================================== -->

  <text
    x="45"
    y="300"
    fill="#ffffff"
    font-size="18"
    font-family="Arial, Helvetica, sans-serif"
    font-weight="700"
  >
    Technologies Used
  </text>


  <text
    x="45"
    y="323"
    fill="#8b949e"
    font-size="13"
    font-family="Arial, Helvetica, sans-serif"
  >
    Based on primary languages across public repositories
  </text>


  ${generateLanguageBars(languages)}


  <!-- ====================================================== -->
  <!-- FOOTER -->
  <!-- ====================================================== -->

  <text
    x="45"
    y="470"
    fill="#6e7681"
    font-size="11"
    font-family="Arial, Helvetica, sans-serif"
  >
    Automatically generated from GitHub data
  </text>


  <text
    x="955"
    y="470"
    fill="#6e7681"
    font-size="11"
    font-family="Arial, Helvetica, sans-serif"
    text-anchor="end"
  >
    @Kumar209
  </text>

</svg>
`;
}


// ============================================================
// STAT CARD
// ============================================================

function statCard(
  x,
  y,
  label,
  value
) {

  return `
    <rect
      x="${x}"
      y="${y}"
      width="175"
      height="78"
      rx="13"
      fill="#161b22"
      stroke="#30363d"
    />

    <text
      x="${x + 16}"
      y="${y + 27}"
      fill="#8b949e"
      font-size="12"
      font-family="Arial, Helvetica, sans-serif"
    >
      ${label}
    </text>

    <text
      x="${x + 16}"
      y="${y + 58}"
      fill="#ffffff"
      font-size="24"
      font-family="Arial, Helvetica, sans-serif"
      font-weight="700"
    >
      ${Number(value).toLocaleString()}
    </text>
  `;
}


// ============================================================
// SECONDARY STAT
// ============================================================

function secondaryStat(
  x,
  label,
  value
) {

  return `
    <text
      x="${x}"
      y="220"
      fill="#8b949e"
      font-size="12"
      font-family="Arial, Helvetica, sans-serif"
    >
      ${label}
    </text>


    <text
      x="${x}"
      y="247"
      fill="#ffffff"
      font-size="21"
      font-family="Arial, Helvetica, sans-serif"
      font-weight="700"
    >
      ${Number(value).toLocaleString()}
    </text>
  `;
}


// ============================================================
// TOP LANGUAGES
// ============================================================

function getTopLanguages(
  repositories
) {

  const languageCounts = {};


  for (
    const repository
    of repositories
  ) {

    const language =
      repository
        .primaryLanguage
        ?.name;


    if (!language) {
      continue;
    }


    languageCounts[language] =
      (languageCounts[language] || 0) +
      1;

  }


  const sortedLanguages =
    Object.entries(
      languageCounts
    )

      .sort(
        (a, b) =>
          b[1] - a[1]
      )

      .slice(0, 5);


  const total =
    sortedLanguages.reduce(
      (sum, [, count]) =>
        sum + count,
      0
    );


  return sortedLanguages.map(
    ([name, count]) => ({

      name,

      count,

      percentage:
        total > 0
          ? Math.round(
              (count / total) * 100
            )
          : 0,

    })
  );
}


// ============================================================
// LANGUAGE BARS
// ============================================================

function generateLanguageBars(
  languages
) {

  if (!languages.length) {

    return `
      <text
        x="45"
        y="365"
        fill="#8b949e"
        font-size="14"
        font-family="Arial, Helvetica, sans-serif"
      >
        No language data available.
      </text>
    `;

  }


  let output = "";


  languages.forEach(
    (language, index) => {

      const y =
        355 +
        index * 23;


      const barWidth =
        Math.max(
          10,
          language.percentage * 4.8
        );


      output += `

        <text
          x="45"
          y="${y}"
          fill="#c9d1d9"
          font-size="12"
          font-family="Arial, Helvetica, sans-serif"
          font-weight="600"
        >
          ${escapeXML(
            language.name
          )}
        </text>


        <rect
          x="160"
          y="${y - 11}"
          width="480"
          height="10"
          rx="5"
          fill="#161b22"
        />


        <rect
          x="160"
          y="${y - 11}"
          width="${barWidth}"
          height="10"
          rx="5"
          fill="url(#barGradient)"
        />


        <text
          x="660"
          y="${y}"
          fill="#8b949e"
          font-size="12"
          font-family="Arial, Helvetica, sans-serif"
        >
          ${language.percentage}%
        </text>


        <text
          x="720"
          y="${y}"
          fill="#6e7681"
          font-size="11"
          font-family="Arial, Helvetica, sans-serif"
        >
          ${language.count}
          repo${language.count === 1 ? "" : "s"}
        </text>

      `;

    }
  );


  return output;
}


// ============================================================
// XML ESCAPE
// ============================================================

function escapeXML(
  value
) {

  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&apos;"
    );
}


// ============================================================
// RUN
// ============================================================

main().catch(
  error => {

    console.error(error);

    process.exit(1);

  }
);
