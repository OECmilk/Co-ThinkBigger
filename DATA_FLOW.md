# Data Flow & Table Operations

```mermaid
sequenceDiagram
    participant User
    participant App
    participant DB_Auth as Supabase Auth
    participant DB_Public as Public DB

    Note over User, DB_Public: 1. Account Creation
    User->>App: Sign Up
    App->>DB_Auth: Create User (auth.users)
    DB_Auth->>DB_Public: Trigger "handle_new_user"<br/>Insert into [Profile]

    Note over User, DB_Public: 2. Project Creation
    User->>App: Create Project
    App->>DB_Public: Insert into [Project]
    App->>DB_Public: Insert into [ProjectMember]<br/>(Link Profile & Project)

    Note over User, DB_Public: 3. Core Workflow
    
    User->>App: Step 1: Add Candidate
    App->>DB_Public: Insert into [Candidate]
    
    User->>App: Step 1: Reaction
    App->>DB_Public: Insert into [Reaction]

    User->>App: Step 2: Add SubProblem
    App->>DB_Public: Insert into [SubProblem]

    User->>App: Step 3: Add Desire
    App->>DB_Public: Insert into [Desire]

    User->>App: Step 4: Add Choice
    App->>DB_Public: Insert into [Choice]

    User->>App: Step 5: Save Solution
    App->>DB_Public: Insert into [Solution]

    User->>App: Step 6: Evaluate
    App->>DB_Public: Insert into [Evaluation]

    Note over App, DB_Public: Achievement System
    App->>DB_Public: Insert into [Achievement]<br/>(Triggered by actions)
```

## Table Columns Added By Phase

| Phase | Table | Trigger/Action | Key Columns |
|-------|-------|----------------|-------------|
| **Signup** | `Profile` | Auto-Trigger | `userId`, `username`, `avatarUrl` |
| **New Project** | `Project` | User Action | `name`, `description`, `inviteCode` |
| | `ProjectMember` | User Action | `projectId`, `profileId`, `role` |
| **Step 1** | `Candidate` | User Action | `projectId`, `title`, `authorId` |
| **Step 2** | `SubProblem` | User Action | `projectId`, `title` |
| **Step 3** | `Desire` | User Action | `projectId`, `type`, `content` |
| **Step 4** | `Choice` | User Action | `subProblemId`, `title`, `isOutsideDomain` |
| **Step 5** | `Solution` | User Action | `projectId`, `name`, `components` (JSON) |
| **Step 6** | `Evaluation` | User Action | `solutionId`, `desireId`, `score` |
