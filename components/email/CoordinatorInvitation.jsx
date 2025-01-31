import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export const CoordinatorInvitation = ({
  eventName,
  tagline,
  shortDescription,
  featureImageUrl,
  eventDate,
  ngoName,
  activityURL,

  email,
}) => {
  // const formattedDate = new Intl.DateTimeFormat("en", {
  //   dateStyle: "long",
  //   timeStyle: "short",
  // }).format(loginDate);

  return (
    <Html>
      <Head />
      <Preview>Co-ordinator| NGO Connect</Preview>
      <Body style={main}>
        <Container>
          <Section style={content}>
            <Row style={{ ...boxInfos, paddingBottom: "0" }}>
              <Column>
                <Heading
                  style={{
                    fontSize: 32,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Hi Co-ordinator for {eventName},
                </Heading>
                <Heading
                  as="h2"
                  style={{
                    fontSize: 26,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  You&apos; ve been invited to manage the event {eventName}.
                </Heading>
                <Section style={containerImageFooter}>
                  <Img style={image} width={620} src={featureImageUrl} />
                </Section>
                <Text style={paragraph}>
                  <b>Event Name: </b>
                  {eventName} ~ {tagline}
                </Text>

                <Text style={paragraph}>
                  <b>Event Date: </b>
                  {eventDate}
                </Text>
                <Text style={{ ...paragraph, marginTop: -5 }}>
                  <b>NGO Name:</b> {ngoName}
                </Text>
                <Text style={{ ...paragraph, marginTop: -5 }}>
                  <b>Event URL: </b>
                  {activityURL}
                </Text>
                {/* <Text style={{ ...paragraph, marginTop: -5 }}>
                  <b>Invitation Sent Time: </b>
                  {formattedDate}
                </Text> */}
              </Column>
            </Row>
          </Section>

          <Text
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "rgb(0,0,0, 0.7)",
            }}
          >
            © {new Date().getFullYear()} | NGO Connect | Co-ordinator Message |
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#fff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const paragraph = {
  fontSize: 16,
};

const logo = {
  padding: "30px 20px",
};

const containerButton = {
  display: "flex",
  justifyContent: "center",
  width: "100%",
};

const button = {
  backgroundColor: "#e00707",
  borderRadius: 3,
  color: "#FFF",
  fontWeight: "bold",
  border: "1px solid rgb(0,0,0, 0.1)",
  cursor: "pointer",
  padding: "12px 30px",
};

const content = {
  border: "1px solid rgb(0,0,0, 0.1)",
  borderRadius: "3px",
  overflow: "hidden",
};

const image = {
  maxWidth: "100%",
};

const boxInfos = {
  padding: "20px",
};

const containerImageFooter = {
  padding: "45px 0 0 0",
};
