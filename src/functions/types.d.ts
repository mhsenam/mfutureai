declare module "firebase-functions" {
  interface EventContext {
    eventId: string;
    timestamp: string;
    eventType: string;
    resource: {
      name: string;
      service: string;
    };
  }

  namespace pubsub {
    interface ScheduleBuilder {
      schedule(expression: string): {
        onRun(handler: (context?: EventContext) => Promise<unknown>): unknown;
      };
    }
  }

  const pubsub: {
    schedule: (expression: string) => {
      onRun: (handler: (context?: EventContext) => Promise<unknown>) => unknown;
    };
  };

  const config: () => {
    [key: string]: {
      [key: string]: string;
    };
  };
}

declare module "firebase-admin" {
  interface App {
    firestore(): Firestore;
  }

  interface Firestore {
    collection(path: string): CollectionReference;
  }

  interface CollectionReference {
    get(): Promise<QuerySnapshot>;
    doc(path: string): DocumentReference;
  }

  interface DocumentReference {
    get(): Promise<DocumentSnapshot>;
  }

  interface DocumentSnapshot {
    data(): Record<string, unknown>;
    id: string;
  }

  interface QuerySnapshot {
    docs: DocumentSnapshot[];
    forEach(callback: (doc: DocumentSnapshot) => void): void;
  }

  function initializeApp(): App;

  export function firestore() {
    throw new Error("Function not implemented.");
  }
}

declare module "nodemailer" {
  interface TransportOptions {
    service: string;
    auth: {
      user: string;
      pass: string;
    };
  }

  interface MailOptions {
    from: string;
    to: string;
    subject: string;
    html: string;
  }

  interface Transporter {
    sendMail(mailOptions: MailOptions): Promise<unknown>;
  }

  function createTransport(options: TransportOptions): Transporter;
}
